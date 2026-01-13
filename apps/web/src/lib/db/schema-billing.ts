import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organization } from "./schema";

// ============================================================================
// BILLING (Cloud Mode Only)
// ============================================================================

export const organizationBilling = pgTable(
  "organization_billing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" })
      .unique(),
    // Plan
    planId: text("plan_id").notNull().default("free"),
    billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly or yearly
    // Stripe
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    // Status
    status: text("status").notNull().default("active"), // active, past_due, canceled, trialing
    trialEndsAt: timestamp("trial_ends_at"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    // Usage tracking
    currentSubscribers: integer("current_subscribers").notNull().default(0),
    currentApiRequests: integer("current_api_requests").notNull().default(0),
    usageResetAt: timestamp("usage_reset_at"),
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("org_billing_org_idx").on(table.organizationId)]
);

export const billingInvoice = pgTable(
  "billing_invoice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // Stripe
    stripeInvoiceId: text("stripe_invoice_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    // Details
    amountDue: integer("amount_due").notNull(), // in cents
    amountPaid: integer("amount_paid").notNull().default(0),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull(), // draft, open, paid, void, uncollectible
    // Dates
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    // PDF
    invoicePdfUrl: text("invoice_pdf_url"),
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("billing_invoice_org_idx").on(table.organizationId)]
);

export const usageRecord = pgTable(
  "usage_record",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // Metrics
    metric: text("metric").notNull(), // api_requests, subscribers, webhook_events
    count: integer("count").notNull(),
    // Time period
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("usage_record_org_idx").on(table.organizationId),
    index("usage_record_period_idx").on(table.periodStart, table.periodEnd),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const organizationBillingRelations = relations(
  organizationBilling,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationBilling.organizationId],
      references: [organization.id],
    }),
  })
);

export const billingInvoiceRelations = relations(billingInvoice, ({ one }) => ({
  organization: one(organization, {
    fields: [billingInvoice.organizationId],
    references: [organization.id],
  }),
}));

export const usageRecordRelations = relations(usageRecord, ({ one }) => ({
  organization: one(organization, {
    fields: [usageRecord.organizationId],
    references: [organization.id],
  }),
}));

