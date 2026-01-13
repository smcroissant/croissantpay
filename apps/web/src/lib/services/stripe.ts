import Stripe from "stripe";
import { db } from "@/lib/db";
import { organizationBilling, billingInvoice } from "@/lib/db/schema-billing";
import { organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, isCloudMode } from "@/lib/config";

// Lazy-load Stripe client only when needed (in cloud mode)
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!isCloudMode()) {
    throw new Error("Stripe is only available in cloud mode");
  }

  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: "2024-12-18.acacia",
    });
  }

  return stripeClient;
}

// Stripe Price IDs for each plan (configure in Stripe Dashboard)
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "",
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY || "",
  },
  scale: {
    monthly: process.env.STRIPE_PRICE_SCALE_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_SCALE_YEARLY || "",
  },
};

export interface CreateCheckoutParams {
  organizationId: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionInfo {
  planId: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

// Create a Stripe checkout session for upgrading
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<string> {
  if (!isCloudMode()) {
    throw new Error("Stripe checkout only available in cloud mode");
  }

  const { organizationId, planId, billingCycle, successUrl, cancelUrl } = params;

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(organizationId);

  const priceId = STRIPE_PRICE_IDS[planId]?.[billingCycle];
  if (!priceId) {
    throw new Error(`Invalid plan or billing cycle: ${planId} ${billingCycle}`);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      organizationId,
      planId,
      billingCycle,
    },
    subscription_data: {
      metadata: {
        organizationId,
        planId,
      },
    },
  });

  return session.url || "";
}

// Create a Stripe billing portal session
export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string
): Promise<string> {
  if (!isCloudMode()) {
    throw new Error("Billing portal only available in cloud mode");
  }

  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (!billing?.stripeCustomerId) {
    throw new Error("No Stripe customer found for organization");
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

// Get or create Stripe customer for organization
async function getOrCreateStripeCustomer(organizationId: string): Promise<string> {
  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (billing?.stripeCustomerId) {
    return billing.stripeCustomerId;
  }

  // Get organization details
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  if (!org) {
    throw new Error("Organization not found");
  }

  // Create Stripe customer
  const customer = await getStripe().customers.create({
    name: org.name,
    metadata: {
      organizationId,
    },
  });

  // Update billing record
  await db
    .update(organizationBilling)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));

  return customer.id;
}

// Handle Stripe webhook events
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object as Stripe.Invoice);
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const planId = session.metadata?.planId;
  const billingCycle = session.metadata?.billingCycle;

  if (!organizationId || !planId) return;

  await db
    .update(organizationBilling)
    .set({
      planId,
      billingCycle: billingCycle || "monthly",
      stripeSubscriptionId: session.subscription as string,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  const planId = subscription.metadata?.planId || "free";

  await db
    .update(organizationBilling)
    .set({
      planId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status === "active" ? "active" : subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) return;

  await db
    .update(organizationBilling)
    .set({
      planId: "free",
      status: "canceled",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find organization by customer ID
  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.stripeCustomerId, customerId))
    .limit(1);

  if (!billing) return;

  // Record invoice
  await db.insert(billingInvoice).values({
    organizationId: billing.organizationId,
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: invoice.payment_intent as string,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    status: "paid",
    periodStart: new Date(invoice.period_start * 1000),
    periodEnd: new Date(invoice.period_end * 1000),
    paidAt: new Date(),
    invoicePdfUrl: invoice.invoice_pdf,
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.stripeCustomerId, customerId))
    .limit(1);

  if (!billing) return;

  // Update billing status
  await db
    .update(organizationBilling)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, billing.organizationId));

  // Record failed invoice
  await db.insert(billingInvoice).values({
    organizationId: billing.organizationId,
    stripeInvoiceId: invoice.id,
    amountDue: invoice.amount_due,
    amountPaid: 0,
    currency: invoice.currency,
    status: "open",
    periodStart: new Date(invoice.period_start * 1000),
    periodEnd: new Date(invoice.period_end * 1000),
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
  });
}

// Get subscription info for dashboard
export async function getSubscriptionInfo(
  organizationId: string
): Promise<SubscriptionInfo | null> {
  if (!isCloudMode()) return null;

  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (!billing) return null;

  return {
    planId: billing.planId,
    status: billing.status,
    billingCycle: billing.billingCycle,
    currentPeriodEnd: billing.currentPeriodEnd,
    cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
  };
}

// Cancel subscription at period end
export async function cancelSubscription(
  organizationId: string
): Promise<void> {
  if (!isCloudMode()) return;

  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (!billing?.stripeSubscriptionId) {
    throw new Error("No active subscription found");
  }

  await getStripe().subscriptions.update(billing.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume canceled subscription
export async function resumeSubscription(
  organizationId: string
): Promise<void> {
  if (!isCloudMode()) return;

  const [billing] = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (!billing?.stripeSubscriptionId) {
    throw new Error("No subscription found");
  }

  await getStripe().subscriptions.update(billing.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}

