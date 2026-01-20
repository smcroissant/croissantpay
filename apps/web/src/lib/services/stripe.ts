import Stripe from "stripe";
import { isCloudMode } from "@/lib/config";

// Lazy-load Stripe client only when needed (in cloud mode)
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isCloudMode()) {
    throw new Error("Stripe is only available in cloud mode");
  }

  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: "2025-12-15.clover",
    });
  }

  return stripeClient;
}

/**
 * Create a Stripe billing portal session for an organization
 * Use this when you need custom portal access outside of Better Auth
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!isCloudMode()) {
    throw new Error("Billing portal only available in cloud mode");
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Format a Stripe price amount (in cents) to a readable string
 */
export function formatStripeAmount(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * Check if a subscription is in a valid/active state
 */
export function isSubscriptionActive(status: string): boolean {
  return ["active", "trialing", "past_due"].includes(status);
}
