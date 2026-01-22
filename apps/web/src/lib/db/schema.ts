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
  // Two-Factor Authentication
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  // Last Login Method tracking
  lastLoginMethod: text("last_login_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
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
    // Better Auth organization plugin fields
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_user_idx").on(table.userId)]
);

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

// Two-Factor Authentication table
// See: https://www.better-auth.com/docs/plugins/2fa
export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    secret: text("secret"),
    backupCodes: text("backup_codes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("two_factor_user_idx").on(table.userId)]
);

// Passkey table for WebAuthn/FIDO2 authentication
// See: https://www.better-auth.com/docs/plugins/passkey
export const passkey = pgTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("passkey_user_idx").on(table.userId)]
);

// ============================================================================
// ORGANIZATION & TEAM
// ============================================================================

export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(0),
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

export const organizationInvitation = pgTable(
  "organization_invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"), // admin, member
    status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invitation_org_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

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
    // SDK Integration test tracking
    lastIntegrationTest: timestamp("last_integration_test"),
    lastIntegrationTestPlatform: text("last_integration_test_platform"), // ios, android, web
    lastIntegrationTestVersion: text("last_integration_test_version"), // SDK version
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
// WEBHOOK EVENTS LOG (Incoming from Apple/Google)
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
    // Environment (sandbox, production, test)
    environment: text("environment").default("production"), // Sandbox, Production, or Test
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
// WEBHOOK DELIVERIES (Outbound to Customer Servers)
// ============================================================================

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "success",
  "failed",
]);

export const webhookDelivery = pgTable(
  "webhook_delivery",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => app.id, { onDelete: "cascade" }),
    // Event info
    eventId: text("event_id").notNull(), // Unique event ID (evt_xxx)
    eventType: text("event_type").notNull(), // e.g., subscription.renewed
    // Source reference (optional - link to incoming webhook that triggered this)
    sourceWebhookEventId: uuid("source_webhook_event_id").references(
      () => webhookEvent.id,
      { onDelete: "set null" }
    ),
    // Subscriber context
    subscriberId: uuid("subscriber_id").references(() => subscriber.id, {
      onDelete: "set null",
    }),
    appUserId: text("app_user_id"),
    // Delivery details
    webhookUrl: text("webhook_url").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    // Response
    status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
    statusCode: integer("status_code"),
    responseBody: text("response_body"),
    errorMessage: text("error_message"),
    // Performance
    duration: integer("duration"), // milliseconds
    // Retry tracking
    attemptCount: integer("attempt_count").notNull().default(1),
    nextRetryAt: timestamp("next_retry_at"),
    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    index("webhook_delivery_app_idx").on(table.appId),
    index("webhook_delivery_event_type_idx").on(table.eventType),
    index("webhook_delivery_status_idx").on(table.status),
    index("webhook_delivery_subscriber_idx").on(table.subscriberId),
    index("webhook_delivery_created_idx").on(table.createdAt),
  ]
);

export const webhookDeliveryRelations = relations(webhookDelivery, ({ one }) => ({
  app: one(app, {
    fields: [webhookDelivery.appId],
    references: [app.id],
  }),
  subscriber: one(subscriber, {
    fields: [webhookDelivery.subscriberId],
    references: [subscriber.id],
  }),
  sourceWebhookEvent: one(webhookEvent, {
    fields: [webhookDelivery.sourceWebhookEventId],
    references: [webhookEvent.id],
  }),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizationMemberships: many(organizationMember),
  twoFactor: one(twoFactor),
  passkeys: many(passkey),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, {
    fields: [passkey.userId],
    references: [user.id],
  }),
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

