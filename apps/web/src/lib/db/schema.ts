import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  varchar,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const platformEnum = pgEnum("platform", ["ios", "android"]);
export const productTypeEnum = pgEnum("product_type", [
  "consumable",
  "non_consumable",
  "auto_renewable_subscription",
  "non_renewing_subscription",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "expired",
  "in_grace_period",
  "in_billing_retry",
  "paused",
  "revoked",
]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "deferred",
]);

// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// ORGANIZATION & TEAM
// ============================================================================

export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizationMember = pgTable(
  "organization_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner, admin, member
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("org_member_unique").on(table.organizationId, table.userId),
  ]
);

export const organizationInvitation = pgTable("organization_invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // admin, member
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// APPS
// ============================================================================

export const app = pgTable(
  "app",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    bundleId: text("bundle_id"), // iOS bundle ID
    packageName: text("package_name"), // Android package name
    // API Keys
    publicKey: text("public_key").notNull().unique(),
    secretKey: text("secret_key").notNull().unique(),
    // Apple App Store Configuration
    appleTeamId: text("apple_team_id"),
    appleKeyId: text("apple_key_id"),
    appleIssuerId: text("apple_issuer_id"),
    appleVendorNumber: text("apple_vendor_number"), // For importing products/prices
    applePrivateKey: text("apple_private_key"), // encrypted
    appleSharedSecret: text("apple_shared_secret"), // encrypted
    // Google Play Configuration
    googleServiceAccount: text("google_service_account"), // encrypted JSON
    // Webhook Configuration
    appleWebhookId: text("apple_webhook_id").unique(), // Unique ID for Apple webhook URL
    googleWebhookId: text("google_webhook_id").unique(), // Unique ID for Google webhook URL
    // Settings (for forwarding to your own webhook)
    webhookUrl: text("webhook_url"),
    webhookSecret: text("webhook_secret"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("app_org_idx").on(table.organizationId)]
);

// ============================================================================
// PRODUCTS & OFFERINGS
// ============================================================================

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(), // your product ID
    storeProductId: text("store_product_id").notNull(), // App Store / Play Store ID
    platform: platformEnum("platform").notNull(),
    type: productTypeEnum("type").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    // Subscription specific
    subscriptionGroupId: text("subscription_group_id"),
    trialDuration: text("trial_duration"), // ISO 8601 duration (P7D, P1M)
    subscriptionPeriod: text("subscription_period"), // ISO 8601 duration
    // Metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("product_app_idx").on(table.appId),
    uniqueIndex("product_store_unique").on(
      table.appId,
      table.storeProductId,
      table.platform
    ),
  ]
);

export const entitlement = pgTable(
  "entitlement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("entitlement_app_idx").on(table.appId),
    uniqueIndex("entitlement_app_identifier").on(table.appId, table.identifier),
  ]
);

export const productEntitlement = pgTable(
  "product_entitlement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    entitlementId: uuid("entitlement_id")
      .notNull()
      .references(() => entitlement.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_entitlement_unique").on(
      table.productId,
      table.entitlementId
    ),
  ]
);

export const offering = pgTable(
  "offering",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    identifier: text("identifier").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    isCurrent: boolean("is_current").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("offering_app_idx").on(table.appId),
    uniqueIndex("offering_app_identifier").on(table.appId, table.identifier),
  ]
);

export const offeringProduct = pgTable(
  "offering_product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    offeringId: uuid("offering_id")
      .notNull()
      .references(() => offering.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("offering_product_unique").on(
      table.offeringId,
      table.productId
    ),
  ]
);

// ============================================================================
// SUBSCRIBERS
// ============================================================================

export const subscriber = pgTable(
  "subscriber",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    appUserId: text("app_user_id").notNull(), // ID from your app
    // Aliases for cross-platform identity
    aliases: jsonb("aliases").$type<string[]>().default([]),
    // Custom attributes
    attributes: jsonb("attributes").$type<Record<string, unknown>>(),
    // Original purchase info
    originalAppUserId: text("original_app_user_id"),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("subscriber_app_idx").on(table.appId),
    uniqueIndex("subscriber_app_user").on(table.appId, table.appUserId),
  ]
);

// ============================================================================
// PURCHASES & SUBSCRIPTIONS
// ============================================================================

export const purchase = pgTable(
  "purchase",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscriber.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    platform: platformEnum("platform").notNull(),
    // Transaction info
    storeTransactionId: text("store_transaction_id").notNull(),
    originalTransactionId: text("original_transaction_id"),
    // Receipt/token data
    receiptData: text("receipt_data"), // iOS receipt or Android purchase token
    // Status
    status: purchaseStatusEnum("status").notNull().default("pending"),
    // Pricing
    priceAmountMicros: integer("price_amount_micros"),
    priceCurrencyCode: varchar("price_currency_code", { length: 3 }),
    // Dates
    purchaseDate: timestamp("purchase_date").notNull(),
    expiresDate: timestamp("expires_date"), // for subscriptions
    // Store response
    storeResponse: jsonb("store_response").$type<Record<string, unknown>>(),
    // Metadata
    environment: text("environment").default("production"), // sandbox or production
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("purchase_subscriber_idx").on(table.subscriberId),
    index("purchase_product_idx").on(table.productId),
    uniqueIndex("purchase_transaction_unique").on(
      table.platform,
      table.storeTransactionId
    ),
  ]
);

export const subscription = pgTable(
  "subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscriber.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    platform: platformEnum("platform").notNull(),
    // Transaction references
    originalTransactionId: text("original_transaction_id").notNull(),
    latestTransactionId: text("latest_transaction_id"),
    // Status
    status: subscriptionStatusEnum("status").notNull().default("active"),
    // Dates
    purchaseDate: timestamp("purchase_date").notNull(),
    originalPurchaseDate: timestamp("original_purchase_date").notNull(),
    expiresDate: timestamp("expires_date"),
    gracePeriodExpiresDate: timestamp("grace_period_expires_date"),
    billingRetryExpiresDate: timestamp("billing_retry_expires_date"),
    // Renewal info
    autoRenewEnabled: boolean("auto_renew_enabled").notNull().default(true),
    autoRenewProductId: uuid("auto_renew_product_id").references(
      () => product.id
    ),
    // Trial
    isTrialPeriod: boolean("is_trial_period").notNull().default(false),
    isInIntroOfferPeriod: boolean("is_in_intro_offer_period")
      .notNull()
      .default(false),
    // Cancellation
    canceledAt: timestamp("canceled_at"),
    cancellationReason: text("cancellation_reason"),
    // Store data
    storeResponse: jsonb("store_response").$type<Record<string, unknown>>(),
    environment: text("environment").default("production"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("subscription_subscriber_idx").on(table.subscriberId),
    uniqueIndex("subscription_original_tx").on(
      table.platform,
      table.originalTransactionId
    ),
  ]
);

// Active entitlements for a subscriber (computed/cached)
export const subscriberEntitlement = pgTable(
  "subscriber_entitlement",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscriber.id, { onDelete: "cascade" }),
    entitlementId: uuid("entitlement_id")
      .notNull()
      .references(() => entitlement.id, { onDelete: "cascade" }),
    // Source of entitlement
    productId: uuid("product_id").references(() => product.id),
    subscriptionId: uuid("subscription_id").references(() => subscription.id),
    purchaseId: uuid("purchase_id").references(() => purchase.id),
    // Validity
    isActive: boolean("is_active").notNull().default(true),
    expiresDate: timestamp("expires_date"),
    // Grant info for manual grants
    grantedBy: text("granted_by"), // user ID who granted
    grantReason: text("grant_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("sub_entitlement_subscriber_idx").on(table.subscriberId),
    uniqueIndex("sub_entitlement_unique").on(
      table.subscriberId,
      table.entitlementId
    ),
  ]
);

// ============================================================================
// API REQUEST LOGS
// ============================================================================

export const apiRequestMethodEnum = pgEnum("api_request_method", [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export const apiRequestLog = pgTable(
  "api_request_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    appId: uuid("app_id").references(() => app.id, { onDelete: "set null" }),
    // Request info
    method: apiRequestMethodEnum("method").notNull(),
    path: text("path").notNull(),
    query: jsonb("query").$type<Record<string, string>>(),
    headers: jsonb("headers").$type<Record<string, string>>(),
    body: jsonb("body").$type<Record<string, unknown>>(),
    // Response info
    statusCode: integer("status_code").notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>(),
    responseTime: integer("response_time"), // milliseconds
    // Client info
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    // Auth info
    apiKeyType: text("api_key_type"), // public or secret
    apiKeyPrefix: text("api_key_prefix"), // First 8 chars of the key used
    // Subscriber context (if applicable)
    subscriberId: text("subscriber_id"),
    appUserId: text("app_user_id"),
    // Error info
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("api_log_org_idx").on(table.organizationId),
    index("api_log_app_idx").on(table.appId),
    index("api_log_created_idx").on(table.createdAt),
    index("api_log_path_idx").on(table.path),
    index("api_log_status_idx").on(table.statusCode),
  ]
);

export const apiRequestLogRelations = relations(apiRequestLog, ({ one }) => ({
  organization: one(organization, {
    fields: [apiRequestLog.organizationId],
    references: [organization.id],
  }),
  app: one(app, {
    fields: [apiRequestLog.appId],
    references: [app.id],
  }),
}));

// ============================================================================
// WEBHOOK EVENTS LOG
// ============================================================================

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    eventType: text("event_type").notNull(),
    eventId: text("event_id"), // Store's event ID
    // Payload
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    // Processing
    processedAt: timestamp("processed_at"),
    error: text("error"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("webhook_event_app_idx").on(table.appId),
    index("webhook_event_type_idx").on(table.eventType),
  ]
);

// ============================================================================
// PROMO CODES
// ============================================================================

export const promoCodeTypeEnum = pgEnum("promo_code_type", [
  "percentage_discount",  // X% off
  "fixed_discount",       // $X off
  "free_trial_extension", // Extend trial by X days
  "free_subscription",    // Free subscription for X period
]);

export const promoCode = pgTable(
  "promo_code",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    // Code info
    code: text("code").notNull(), // Unique per app
    name: text("name").notNull(), // Internal name
    description: text("description"),
    // Type and value
    type: promoCodeTypeEnum("type").notNull(),
    discountPercent: integer("discount_percent"), // For percentage_discount
    discountAmount: integer("discount_amount"), // For fixed_discount (in cents)
    freeTrialDays: integer("free_trial_days"), // For free_trial_extension
    freePeriod: text("free_period"), // For free_subscription (ISO 8601 duration)
    // Applicability
    productIds: text("product_ids").array(), // Specific products, null = all
    entitlementIds: text("entitlement_ids").array(), // Entitlements to grant
    // Limits
    maxRedemptions: integer("max_redemptions"), // null = unlimited
    maxRedemptionsPerUser: integer("max_redemptions_per_user").default(1),
    currentRedemptions: integer("current_redemptions").notNull().default(0),
    // Validity
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    // Metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("promo_code_app_idx").on(table.appId),
    uniqueIndex("promo_code_app_code_unique").on(table.appId, table.code),
  ]
);

export const promoCodeRedemption = pgTable(
  "promo_code_redemption",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promoCodeId: uuid("promo_code_id")
      .notNull()
      .references(() => promoCode.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscriber.id, { onDelete: "cascade" }),
    // Redemption details
    redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
    // What was applied
    appliedDiscount: integer("applied_discount"), // Amount saved (in cents)
    grantedEntitlements: text("granted_entitlements").array(),
    grantedTrialDays: integer("granted_trial_days"),
    // Link to resulting purchase/subscription if any
    purchaseId: uuid("purchase_id").references(() => purchase.id),
    subscriptionId: uuid("subscription_id").references(() => subscription.id),
    // Status
    status: text("status").notNull().default("applied"), // applied, expired, revoked
    expiresAt: timestamp("expires_at"), // When benefits expire
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("promo_redemption_code_idx").on(table.promoCodeId),
    index("promo_redemption_subscriber_idx").on(table.subscriberId),
    uniqueIndex("promo_redemption_unique").on(table.promoCodeId, table.subscriberId),
  ]
);

// ============================================================================
// A/B TESTING (EXPERIMENTS)
// ============================================================================

export const experimentStatusEnum = pgEnum("experiment_status", [
  "draft",      // Not yet running
  "running",    // Currently active
  "paused",     // Temporarily stopped
  "completed",  // Finished, results available
  "archived",   // No longer relevant
]);

export const experiment = pgTable(
  "experiment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    // Basic info
    name: text("name").notNull(),
    description: text("description"),
    hypothesis: text("hypothesis"), // What we're testing
    // Status
    status: experimentStatusEnum("status").notNull().default("draft"),
    // Targeting
    targetAudience: jsonb("target_audience").$type<{
      platforms?: ("ios" | "android")[];
      countries?: string[];
      appVersions?: string[];
      userAttributes?: Record<string, unknown>;
    }>(),
    trafficAllocation: integer("traffic_allocation").notNull().default(100), // % of users in experiment
    // Dates
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    // Goals
    primaryMetric: text("primary_metric").notNull().default("conversion_rate"), // conversion_rate, revenue_per_user, trial_to_paid
    secondaryMetrics: text("secondary_metrics").array(),
    // Results
    winningVariantId: uuid("winning_variant_id"),
    confidenceLevel: integer("confidence_level"), // Statistical significance %
    // Metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("experiment_app_idx").on(table.appId),
    index("experiment_status_idx").on(table.status),
  ]
);

export const experimentVariant = pgTable(
  "experiment_variant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiment.id, { onDelete: "cascade" }),
    // Variant info
    name: text("name").notNull(), // e.g., "Control", "Variant A"
    description: text("description"),
    isControl: boolean("is_control").notNull().default(false),
    // Traffic weight (relative to other variants)
    weight: integer("weight").notNull().default(50), // 50 = 50%
    // What offering to show
    offeringId: uuid("offering_id").references(() => offering.id),
    // Or custom product configuration
    customProducts: jsonb("custom_products").$type<Array<{
      productId: string;
      position: number;
      highlighted?: boolean;
      badge?: string;
    }>>(),
    // Paywall customization
    paywallConfig: jsonb("paywall_config").$type<{
      title?: string;
      subtitle?: string;
      features?: string[];
      ctaText?: string;
      theme?: string;
    }>(),
    // Results
    impressions: integer("impressions").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    revenue: integer("revenue").notNull().default(0), // in cents
    trials: integer("trials").notNull().default(0),
    trialConversions: integer("trial_conversions").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("variant_experiment_idx").on(table.experimentId),
  ]
);

export const experimentAssignment = pgTable(
  "experiment_assignment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    experimentId: uuid("experiment_id")
      .notNull()
      .references(() => experiment.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => experimentVariant.id, { onDelete: "cascade" }),
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscriber.id, { onDelete: "cascade" }),
    // Assignment info
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
    // Conversion tracking
    converted: boolean("converted").notNull().default(false),
    convertedAt: timestamp("converted_at"),
    conversionType: text("conversion_type"), // purchase, trial_start, trial_convert
    revenue: integer("revenue").default(0), // cents
    // Metadata
    metadata: jsonb("metadata").$type<{
      platform?: string;
      appVersion?: string;
      country?: string;
    }>(),
  },
  (table) => [
    index("assignment_experiment_idx").on(table.experimentId),
    index("assignment_subscriber_idx").on(table.subscriberId),
    uniqueIndex("assignment_unique").on(table.experimentId, table.subscriberId),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const experimentRelations = relations(experiment, ({ one, many }) => ({
  app: one(app, {
    fields: [experiment.appId],
    references: [app.id],
  }),
  variants: many(experimentVariant),
  assignments: many(experimentAssignment),
  winningVariant: one(experimentVariant, {
    fields: [experiment.winningVariantId],
    references: [experimentVariant.id],
  }),
}));

export const experimentVariantRelations = relations(
  experimentVariant,
  ({ one, many }) => ({
    experiment: one(experiment, {
      fields: [experimentVariant.experimentId],
      references: [experiment.id],
    }),
    offering: one(offering, {
      fields: [experimentVariant.offeringId],
      references: [offering.id],
    }),
    assignments: many(experimentAssignment),
  })
);

export const experimentAssignmentRelations = relations(
  experimentAssignment,
  ({ one }) => ({
    experiment: one(experiment, {
      fields: [experimentAssignment.experimentId],
      references: [experiment.id],
    }),
    variant: one(experimentVariant, {
      fields: [experimentAssignment.variantId],
      references: [experimentVariant.id],
    }),
    subscriber: one(subscriber, {
      fields: [experimentAssignment.subscriberId],
      references: [subscriber.id],
    }),
  })
);

export const promoCodeRelations = relations(promoCode, ({ one, many }) => ({
  app: one(app, {
    fields: [promoCode.appId],
    references: [app.id],
  }),
  redemptions: many(promoCodeRedemption),
}));

export const promoCodeRedemptionRelations = relations(
  promoCodeRedemption,
  ({ one }) => ({
    promoCode: one(promoCode, {
      fields: [promoCodeRedemption.promoCodeId],
      references: [promoCode.id],
    }),
    subscriber: one(subscriber, {
      fields: [promoCodeRedemption.subscriberId],
      references: [subscriber.id],
    }),
    purchase: one(purchase, {
      fields: [promoCodeRedemption.purchaseId],
      references: [purchase.id],
    }),
    subscription: one(subscription, {
      fields: [promoCodeRedemption.subscriptionId],
      references: [subscription.id],
    }),
  })
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizationMemberships: many(organizationMember),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(organizationMember),
  apps: many(app),
}));

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationMember.organizationId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
  })
);

export const appRelations = relations(app, ({ one, many }) => ({
  organization: one(organization, {
    fields: [app.organizationId],
    references: [organization.id],
  }),
  products: many(product),
  entitlements: many(entitlement),
  offerings: many(offering),
  subscribers: many(subscriber),
  webhookEvents: many(webhookEvent),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  app: one(app, {
    fields: [product.appId],
    references: [app.id],
  }),
  entitlements: many(productEntitlement),
  offeringProducts: many(offeringProduct),
  purchases: many(purchase),
  subscriptions: many(subscription),
}));

export const entitlementRelations = relations(entitlement, ({ one, many }) => ({
  app: one(app, {
    fields: [entitlement.appId],
    references: [app.id],
  }),
  products: many(productEntitlement),
  subscriberEntitlements: many(subscriberEntitlement),
}));

export const productEntitlementRelations = relations(
  productEntitlement,
  ({ one }) => ({
    product: one(product, {
      fields: [productEntitlement.productId],
      references: [product.id],
    }),
    entitlement: one(entitlement, {
      fields: [productEntitlement.entitlementId],
      references: [entitlement.id],
    }),
  })
);

export const offeringRelations = relations(offering, ({ one, many }) => ({
  app: one(app, {
    fields: [offering.appId],
    references: [app.id],
  }),
  products: many(offeringProduct),
}));

export const offeringProductRelations = relations(
  offeringProduct,
  ({ one }) => ({
    offering: one(offering, {
      fields: [offeringProduct.offeringId],
      references: [offering.id],
    }),
    product: one(product, {
      fields: [offeringProduct.productId],
      references: [product.id],
    }),
  })
);

export const subscriberRelations = relations(subscriber, ({ one, many }) => ({
  app: one(app, {
    fields: [subscriber.appId],
    references: [app.id],
  }),
  purchases: many(purchase),
  subscriptions: many(subscription),
  entitlements: many(subscriberEntitlement),
}));

export const purchaseRelations = relations(purchase, ({ one }) => ({
  subscriber: one(subscriber, {
    fields: [purchase.subscriberId],
    references: [subscriber.id],
  }),
  product: one(product, {
    fields: [purchase.productId],
    references: [product.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  subscriber: one(subscriber, {
    fields: [subscription.subscriberId],
    references: [subscriber.id],
  }),
  product: one(product, {
    fields: [subscription.productId],
    references: [product.id],
  }),
  autoRenewProduct: one(product, {
    fields: [subscription.autoRenewProductId],
    references: [product.id],
  }),
}));

export const subscriberEntitlementRelations = relations(
  subscriberEntitlement,
  ({ one }) => ({
    subscriber: one(subscriber, {
      fields: [subscriberEntitlement.subscriberId],
      references: [subscriber.id],
    }),
    entitlement: one(entitlement, {
      fields: [subscriberEntitlement.entitlementId],
      references: [entitlement.id],
    }),
    product: one(product, {
      fields: [subscriberEntitlement.productId],
      references: [product.id],
    }),
    subscription: one(subscription, {
      fields: [subscriberEntitlement.subscriptionId],
      references: [subscription.id],
    }),
    purchase: one(purchase, {
      fields: [subscriberEntitlement.purchaseId],
      references: [purchase.id],
    }),
  })
);

export const webhookEventRelations = relations(webhookEvent, ({ one }) => ({
  app: one(app, {
    fields: [webhookEvent.appId],
    references: [app.id],
  }),
}));

