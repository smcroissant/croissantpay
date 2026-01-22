import { db } from "@/lib/db";
import {
  app,
  webhookDelivery,
  subscriber,
  subscription,
  product,
  entitlement,
  subscriberEntitlement,
  purchase,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// Customer webhook event types (RevenueCat-compatible)
export type CustomerWebhookEvent =
  // Initial purchase events
  | "INITIAL_PURCHASE"
  | "NON_RENEWING_PURCHASE"
  // Renewal events
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  // Cancellation events
  | "CANCELLATION"
  | "UNCANCELLATION"
  // Billing events
  | "BILLING_ISSUE"
  | "BILLING_ISSUE_RESOLVED"
  // Expiration events
  | "EXPIRATION"
  // Subscriber events
  | "SUBSCRIBER_ALIAS"
  // Transfer events
  | "TRANSFER"
  // Refund events
  | "REFUND"
  // Trial events
  | "TRIAL_STARTED"
  | "TRIAL_CONVERTED"
  | "TRIAL_CANCELLED"
  // Pause events (Google only)
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_RESUMED"
  // Grace period
  | "GRACE_PERIOD_ENTERED"
  | "GRACE_PERIOD_EXITED"
  // Test
  | "TEST";

// Legacy event types for backwards compatibility
export type LegacyWebhookEvent =
  | "subscriber.created"
  | "subscriber.updated"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.canceled"
  | "subscription.expired"
  | "subscription.billing_issue"
  | "subscription.product_change"
  | "entitlement.granted"
  | "entitlement.revoked"
  | "purchase.completed"
  | "purchase.refunded"
  | "trial.started"
  | "trial.converted"
  | "trial.expired";

// RevenueCat-compatible webhook payload
export interface CustomerWebhookPayload {
  api_version: string;
  event: {
    id: string;
    type: CustomerWebhookEvent;
    app_id: string;
    event_timestamp_ms: number;
    // Subscriber info
    subscriber_info: {
      id: string;
      app_user_id: string;
      original_app_user_id: string | null;
      aliases: string[];
      first_seen_at: string;
      last_seen_at: string;
      attributes: Record<string, unknown>;
    };
    // Product info
    product?: {
      id: string;
      identifier: string;
      store_product_id: string;
      platform: "ios" | "android";
      type: string;
      display_name: string;
      subscription_period?: string;
      trial_period?: string;
    };
    // Subscription info (if subscription event)
    subscription?: {
      id: string;
      status: string;
      original_transaction_id: string;
      latest_transaction_id: string | null;
      purchase_date: string;
      original_purchase_date: string;
      expires_date: string | null;
      auto_renew_enabled: boolean;
      is_trial_period: boolean;
      is_intro_period: boolean;
      canceled_at: string | null;
      cancellation_reason: string | null;
      grace_period_expires_date: string | null;
      billing_retry_expires_date: string | null;
    };
    // Purchase info (if purchase event)
    purchase?: {
      id: string;
      transaction_id: string;
      original_transaction_id: string | null;
      purchase_date: string;
      status: string;
      price_amount_micros: number | null;
      currency_code: string | null;
    };
    // Entitlements snapshot
    entitlements: Array<{
      id: string;
      identifier: string;
      is_active: boolean;
      expires_date: string | null;
      product_identifier: string | null;
    }>;
    // Platform info
    platform: "ios" | "android";
    environment: "sandbox" | "production";
    // Store event info (original notification from Apple/Google)
    store_event?: {
      type: string;
      subtype?: string;
      event_id?: string;
    };
  };
}

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  duration: number;
  deliveryId?: string;
}

// Build comprehensive subscriber info
async function getSubscriberInfo(subscriberId: string) {
  const [sub] = await db
    .select()
    .from(subscriber)
    .where(eq(subscriber.id, subscriberId))
    .limit(1);

  if (!sub) return null;

  return {
    id: sub.id,
    app_user_id: sub.appUserId,
    original_app_user_id: sub.originalAppUserId,
    aliases: (sub.aliases as string[]) || [],
    first_seen_at: sub.firstSeenAt.toISOString(),
    last_seen_at: sub.lastSeenAt.toISOString(),
    attributes: (sub.attributes as Record<string, unknown>) || {},
  };
}

// Build subscription info
async function getSubscriptionInfo(subscriptionId: string) {
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.id, subscriptionId))
    .limit(1);

  if (!sub) return null;

  return {
    id: sub.id,
    status: sub.status,
    original_transaction_id: sub.originalTransactionId,
    latest_transaction_id: sub.latestTransactionId,
    purchase_date: sub.purchaseDate.toISOString(),
    original_purchase_date: sub.originalPurchaseDate.toISOString(),
    expires_date: sub.expiresDate?.toISOString() || null,
    auto_renew_enabled: sub.autoRenewEnabled,
    is_trial_period: sub.isTrialPeriod,
    is_intro_period: sub.isInIntroOfferPeriod,
    canceled_at: sub.canceledAt?.toISOString() || null,
    cancellation_reason: sub.cancellationReason,
    grace_period_expires_date: sub.gracePeriodExpiresDate?.toISOString() || null,
    billing_retry_expires_date: sub.billingRetryExpiresDate?.toISOString() || null,
  };
}

// Build product info
async function getProductInfo(productId: string) {
  const [prod] = await db
    .select()
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);

  if (!prod) return null;

  return {
    id: prod.id,
    identifier: prod.identifier,
    store_product_id: prod.storeProductId,
    platform: prod.platform,
    type: prod.type,
    display_name: prod.displayName,
    subscription_period: prod.subscriptionPeriod || undefined,
    trial_period: prod.trialDuration || undefined,
  };
}

// Get active entitlements for subscriber
async function getSubscriberEntitlements(subscriberId: string) {
  const entitlements = await db
    .select({
      id: subscriberEntitlement.id,
      entitlementId: subscriberEntitlement.entitlementId,
      identifier: entitlement.identifier,
      isActive: subscriberEntitlement.isActive,
      expiresDate: subscriberEntitlement.expiresDate,
      productId: subscriberEntitlement.productId,
    })
    .from(subscriberEntitlement)
    .leftJoin(entitlement, eq(subscriberEntitlement.entitlementId, entitlement.id))
    .leftJoin(product, eq(subscriberEntitlement.productId, product.id))
    .where(eq(subscriberEntitlement.subscriberId, subscriberId));

  return entitlements.map((e) => ({
    id: e.id,
    identifier: e.identifier || "",
    is_active: e.isActive,
    expires_date: e.expiresDate?.toISOString() || null,
    product_identifier: e.productId || null,
  }));
}

// Get purchase info
async function getPurchaseInfo(purchaseId: string) {
  const [purch] = await db
    .select()
    .from(purchase)
    .where(eq(purchase.id, purchaseId))
    .limit(1);

  if (!purch) return null;

  return {
    id: purch.id,
    transaction_id: purch.storeTransactionId,
    original_transaction_id: purch.originalTransactionId,
    purchase_date: purch.purchaseDate.toISOString(),
    status: purch.status,
    price_amount_micros: purch.priceAmountMicros,
    currency_code: purch.priceCurrencyCode,
  };
}

// Build comprehensive webhook payload
export interface BuildPayloadOptions {
  appId: string;
  eventType: CustomerWebhookEvent;
  subscriberId: string;
  subscriptionId?: string;
  purchaseId?: string;
  productId?: string;
  platform: "ios" | "android";
  environment: "sandbox" | "production";
  storeEvent?: {
    type: string;
    subtype?: string;
    event_id?: string;
  };
}

export async function buildWebhookPayload(
  options: BuildPayloadOptions
): Promise<CustomerWebhookPayload | null> {
  const subscriberInfo = await getSubscriberInfo(options.subscriberId);
  if (!subscriberInfo) return null;

  const entitlements = await getSubscriberEntitlements(options.subscriberId);

  const payload: CustomerWebhookPayload = {
    api_version: "1.0",
    event: {
      id: `evt_${crypto.randomBytes(16).toString("hex")}`,
      type: options.eventType,
      app_id: options.appId,
      event_timestamp_ms: Date.now(),
      subscriber_info: subscriberInfo,
      entitlements,
      platform: options.platform,
      environment: options.environment,
      store_event: options.storeEvent,
    },
  };

  // Add subscription info if available
  if (options.subscriptionId) {
    const subscriptionInfo = await getSubscriptionInfo(options.subscriptionId);
    if (subscriptionInfo) {
      payload.event.subscription = subscriptionInfo;
    }
  }

  // Add purchase info if available
  if (options.purchaseId) {
    const purchaseInfo = await getPurchaseInfo(options.purchaseId);
    if (purchaseInfo) {
      payload.event.purchase = purchaseInfo;
    }
  }

  // Add product info if available
  if (options.productId) {
    const productInfo = await getProductInfo(options.productId);
    if (productInfo) {
      payload.event.product = productInfo;
    }
  }

  return payload;
}

// Send webhook to customer's server with delivery logging
export async function sendCustomerWebhook(
  appId: string,
  event: CustomerWebhookEvent | LegacyWebhookEvent,
  data: Record<string, unknown>,
  options?: {
    sourceWebhookEventId?: string;
    subscriberId?: string;
    appUserId?: string;
  }
): Promise<WebhookDeliveryResult | null> {
  // Get app's webhook configuration
  const [appConfig] = await db
    .select({
      webhookUrl: app.webhookUrl,
      webhookSecret: app.webhookSecret,
    })
    .from(app)
    .where(eq(app.id, appId))
    .limit(1);

  // No webhook URL configured
  if (!appConfig?.webhookUrl) {
    return null;
  }

  const eventId = `evt_${crypto.randomBytes(16).toString("hex")}`;
  const timestamp = new Date();

  // Build payload (can be either legacy format or new comprehensive format)
  const payload = {
    api_version: "1.0",
    event: {
      id: eventId,
      type: event,
      app_id: appId,
      event_timestamp_ms: timestamp.getTime(),
      ...data,
    },
  };

  // Sign payload
  const signature = signPayload(payload, appConfig.webhookSecret || "");

  // Create delivery record
  const [deliveryRecord] = await db
    .insert(webhookDelivery)
    .values({
      appId,
      eventId,
      eventType: event,
      sourceWebhookEventId: options?.sourceWebhookEventId,
      subscriberId: options?.subscriberId,
      appUserId: options?.appUserId,
      webhookUrl: appConfig.webhookUrl,
      payload: payload as Record<string, unknown>,
      status: "pending",
    })
    .returning();

  const startTime = Date.now();

  try {
    const response = await fetch(appConfig.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CroissantPay-Signature": signature,
        "X-CroissantPay-Event": event,
        "X-CroissantPay-Timestamp": timestamp.toISOString(),
        "X-CroissantPay-Delivery-ID": deliveryRecord.id,
        "User-Agent": "CroissantPay-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const duration = Date.now() - startTime;
    let responseBody: string | undefined;

    try {
      responseBody = await response.text();
    } catch {
      // Ignore response body errors
    }

    // Update delivery record
    await db
      .update(webhookDelivery)
      .set({
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        responseBody: responseBody?.substring(0, 10000), // Limit stored response
        duration,
        deliveredAt: response.ok ? new Date() : null,
        errorMessage: response.ok ? null : `HTTP ${response.status}`,
      })
      .where(eq(webhookDelivery.id, deliveryRecord.id));

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      duration,
      deliveryId: deliveryRecord.id,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update delivery record with error
    await db
      .update(webhookDelivery)
      .set({
        status: "failed",
        errorMessage,
        duration,
      })
      .where(eq(webhookDelivery.id, deliveryRecord.id));

    return {
      success: false,
      error: errorMessage,
      duration,
      deliveryId: deliveryRecord.id,
    };
  }
}

// Send comprehensive webhook with full subscriber data
export async function sendComprehensiveWebhook(
  options: BuildPayloadOptions & {
    sourceWebhookEventId?: string;
  }
): Promise<WebhookDeliveryResult | null> {
  // Get app's webhook configuration
  const [appConfig] = await db
    .select({
      webhookUrl: app.webhookUrl,
      webhookSecret: app.webhookSecret,
    })
    .from(app)
    .where(eq(app.id, options.appId))
    .limit(1);

  // No webhook URL configured
  if (!appConfig?.webhookUrl) {
    return null;
  }

  // Build comprehensive payload
  const payload = await buildWebhookPayload(options);
  if (!payload) {
    console.warn(`[Webhook] Could not build payload for subscriber ${options.subscriberId}`);
    return null;
  }

  // Sign payload
  const signature = signPayload(payload, appConfig.webhookSecret || "");

  // Get subscriber for appUserId
  const subscriberInfo = await getSubscriberInfo(options.subscriberId);

  // Create delivery record
  const [deliveryRecord] = await db
    .insert(webhookDelivery)
    .values({
      appId: options.appId,
      eventId: payload.event.id,
      eventType: options.eventType,
      sourceWebhookEventId: options.sourceWebhookEventId,
      subscriberId: options.subscriberId,
      appUserId: subscriberInfo?.app_user_id,
      webhookUrl: appConfig.webhookUrl,
      payload: payload as unknown as Record<string, unknown>,
      status: "pending",
    })
    .returning();

  const startTime = Date.now();

  try {
    const response = await fetch(appConfig.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CroissantPay-Signature": signature,
        "X-CroissantPay-Event": options.eventType,
        "X-CroissantPay-Timestamp": new Date().toISOString(),
        "X-CroissantPay-Delivery-ID": deliveryRecord.id,
        "User-Agent": "CroissantPay-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const duration = Date.now() - startTime;
    let responseBody: string | undefined;

    try {
      responseBody = await response.text();
    } catch {
      // Ignore response body errors
    }

    // Update delivery record
    await db
      .update(webhookDelivery)
      .set({
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        responseBody: responseBody?.substring(0, 10000),
        duration,
        deliveredAt: response.ok ? new Date() : null,
        errorMessage: response.ok ? null : `HTTP ${response.status}`,
      })
      .where(eq(webhookDelivery.id, deliveryRecord.id));

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      duration,
      deliveryId: deliveryRecord.id,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(webhookDelivery)
      .set({
        status: "failed",
        errorMessage,
        duration,
      })
      .where(eq(webhookDelivery.id, deliveryRecord.id));

    return {
      success: false,
      error: errorMessage,
      duration,
      deliveryId: deliveryRecord.id,
    };
  }
}

// Sign webhook payload using HMAC-SHA256
export function signPayload(payload: unknown, secret: string): string {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  return `sha256=${hmac.digest("hex")}`;
}

// Verify webhook signature (for customers to use)
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = signPayload(JSON.parse(payload), secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Queue and send webhook with retries
export async function queueCustomerWebhook(
  appId: string,
  event: CustomerWebhookEvent | LegacyWebhookEvent,
  data: Record<string, unknown>,
  maxRetries: number = 3,
  options?: {
    sourceWebhookEventId?: string;
    subscriberId?: string;
    appUserId?: string;
  }
): Promise<void> {
  let lastError: string | undefined;
  let deliveryId: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendCustomerWebhook(appId, event, data, options);

    if (result === null) {
      // No webhook configured, skip
      return;
    }

    deliveryId = result.deliveryId;

    if (result.success) {
      console.log(
        `[Webhook] Delivered ${event} to app ${appId} (${result.duration}ms)`
      );
      return;
    }

    lastError = result.error || `HTTP ${result.statusCode}`;
    console.warn(
      `[Webhook] Failed attempt ${attempt}/${maxRetries} for ${event}: ${lastError}`
    );

    // Update retry count in delivery record
    if (deliveryId && attempt < maxRetries) {
      const nextRetryAt = new Date(Date.now() + Math.pow(2, attempt) * 1000);
      await db
        .update(webhookDelivery)
        .set({
          attemptCount: attempt + 1,
          nextRetryAt,
        })
        .where(eq(webhookDelivery.id, deliveryId));

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  console.error(
    `[Webhook] Failed to deliver ${event} to app ${appId} after ${maxRetries} attempts: ${lastError}`
  );
}

// Queue comprehensive webhook with full subscriber data and retries
export async function queueComprehensiveWebhook(
  options: BuildPayloadOptions & {
    sourceWebhookEventId?: string;
  },
  maxRetries: number = 3
): Promise<void> {
  let lastError: string | undefined;
  let deliveryId: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendComprehensiveWebhook(options);

    if (result === null) {
      // No webhook configured, skip
      return;
    }

    deliveryId = result.deliveryId;

    if (result.success) {
      console.log(
        `[Webhook] Delivered ${options.eventType} to app ${options.appId} (${result.duration}ms)`
      );
      return;
    }

    lastError = result.error || `HTTP ${result.statusCode}`;
    console.warn(
      `[Webhook] Failed attempt ${attempt}/${maxRetries} for ${options.eventType}: ${lastError}`
    );

    // Update retry count
    if (deliveryId && attempt < maxRetries) {
      const nextRetryAt = new Date(Date.now() + Math.pow(2, attempt) * 1000);
      await db
        .update(webhookDelivery)
        .set({
          attemptCount: attempt + 1,
          nextRetryAt,
        })
        .where(eq(webhookDelivery.id, deliveryId));

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  console.error(
    `[Webhook] Failed to deliver ${options.eventType} to app ${options.appId} after ${maxRetries} attempts: ${lastError}`
  );
}

// Map Apple notification types to CroissantPay events
export function mapAppleEventType(
  notificationType: string,
  subtype?: string
): CustomerWebhookEvent {
  switch (notificationType) {
    case "SUBSCRIBED":
      return "INITIAL_PURCHASE";
    case "DID_RENEW":
      return "RENEWAL";
    case "DID_CHANGE_RENEWAL_PREF":
      return "PRODUCT_CHANGE";
    case "DID_CHANGE_RENEWAL_STATUS":
      if (subtype === "AUTO_RENEW_DISABLED") return "CANCELLATION";
      if (subtype === "AUTO_RENEW_ENABLED") return "UNCANCELLATION";
      return "CANCELLATION";
    case "DID_FAIL_TO_RENEW":
      if (subtype === "GRACE_PERIOD") return "GRACE_PERIOD_ENTERED";
      return "BILLING_ISSUE";
    case "GRACE_PERIOD_EXPIRED":
      return "GRACE_PERIOD_EXITED";
    case "EXPIRED":
      return "EXPIRATION";
    case "REFUND":
      return "REFUND";
    case "REVOKE":
      return "REFUND";
    case "OFFER_REDEEMED":
      return "TRIAL_STARTED";
    case "TEST":
      return "TEST";
    default:
      return "INITIAL_PURCHASE";
  }
}

// Map Google notification types to CroissantPay events
export function mapGoogleEventType(notificationType: number): CustomerWebhookEvent {
  // Google subscription notification types
  switch (notificationType) {
    case 1: // SUBSCRIPTION_RECOVERED
      return "BILLING_ISSUE_RESOLVED";
    case 2: // SUBSCRIPTION_RENEWED
      return "RENEWAL";
    case 3: // SUBSCRIPTION_CANCELED
      return "CANCELLATION";
    case 4: // SUBSCRIPTION_PURCHASED
      return "INITIAL_PURCHASE";
    case 5: // SUBSCRIPTION_ON_HOLD
      return "BILLING_ISSUE";
    case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
      return "GRACE_PERIOD_ENTERED";
    case 7: // SUBSCRIPTION_RESTARTED
      return "UNCANCELLATION";
    case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
      return "PRODUCT_CHANGE";
    case 9: // SUBSCRIPTION_DEFERRED
      return "RENEWAL";
    case 10: // SUBSCRIPTION_PAUSED
      return "SUBSCRIPTION_PAUSED";
    case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
      return "SUBSCRIPTION_PAUSED";
    case 12: // SUBSCRIPTION_REVOKED
      return "REFUND";
    case 13: // SUBSCRIPTION_EXPIRED
      return "EXPIRATION";
    default:
      return "INITIAL_PURCHASE";
  }
}

// Helper to trigger webhooks for subscription events (legacy)
export async function triggerSubscriptionWebhook(
  appId: string,
  event: CustomerWebhookEvent | LegacyWebhookEvent,
  subscriberId: string,
  appUserId: string,
  subscriptionData: {
    productId?: string;
    productIdentifier?: string;
    expiresDate?: Date;
    isTrialPeriod?: boolean;
    [key: string]: unknown;
  }
): Promise<void> {
  await queueCustomerWebhook(
    appId,
    event,
    {
      subscriberId,
      appUserId,
      ...subscriptionData,
      expiresDate: subscriptionData.expiresDate?.toISOString(),
    },
    3,
    { subscriberId, appUserId }
  );
}

// Helper to trigger webhooks for entitlement events
export async function triggerEntitlementWebhook(
  appId: string,
  event: "entitlement.granted" | "entitlement.revoked",
  subscriberId: string,
  appUserId: string,
  entitlementData: {
    entitlementId: string;
    entitlementIdentifier: string;
    productIdentifier?: string;
    expiresDate?: Date;
  }
): Promise<void> {
  await queueCustomerWebhook(
    appId,
    event,
    {
      subscriberId,
      appUserId,
      ...entitlementData,
      expiresDate: entitlementData.expiresDate?.toISOString(),
    },
    3,
    { subscriberId, appUserId }
  );
}

// Helper to trigger purchase webhooks
export async function triggerPurchaseWebhook(
  appId: string,
  event: "purchase.completed" | "purchase.refunded",
  subscriberId: string,
  appUserId: string,
  purchaseData: {
    transactionId: string;
    productIdentifier: string;
    amount?: number;
    currency?: string;
    purchaseDate: Date;
  }
): Promise<void> {
  await queueCustomerWebhook(
    appId,
    event,
    {
      subscriberId,
      appUserId,
      ...purchaseData,
      purchaseDate: purchaseData.purchaseDate.toISOString(),
    },
    3,
    { subscriberId, appUserId }
  );
}

// Generate a new webhook secret
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}

// Get recent webhook deliveries for an app
export async function getWebhookDeliveries(
  appId: string,
  options?: {
    limit?: number;
    status?: "pending" | "success" | "failed";
    eventType?: string;
  }
) {
  let query = db
    .select()
    .from(webhookDelivery)
    .where(eq(webhookDelivery.appId, appId))
    .orderBy(desc(webhookDelivery.createdAt))
    .limit(options?.limit || 100);

  const deliveries = await query;
  return deliveries;
}

// Get webhook delivery stats for an app
export async function getWebhookDeliveryStats(appId: string) {
  const deliveries = await db
    .select()
    .from(webhookDelivery)
    .where(eq(webhookDelivery.appId, appId));

  const total = deliveries.length;
  const success = deliveries.filter((d) => d.status === "success").length;
  const failed = deliveries.filter((d) => d.status === "failed").length;
  const pending = deliveries.filter((d) => d.status === "pending").length;

  // Last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last24h = deliveries.filter((d) => d.createdAt >= oneDayAgo).length;

  // Average duration (for successful deliveries)
  const successfulDurations = deliveries
    .filter((d) => d.status === "success" && d.duration)
    .map((d) => d.duration!);
  const avgDuration =
    successfulDurations.length > 0
      ? Math.round(
          successfulDurations.reduce((a, b) => a + b, 0) / successfulDurations.length
        )
      : 0;

  return {
    total,
    success,
    failed,
    pending,
    last24h,
    avgDuration,
    successRate: total > 0 ? Math.round((success / total) * 100) : 100,
  };
}

// Retry a failed webhook delivery
export async function retryWebhookDelivery(deliveryId: string): Promise<WebhookDeliveryResult | null> {
  const [delivery] = await db
    .select()
    .from(webhookDelivery)
    .where(eq(webhookDelivery.id, deliveryId))
    .limit(1);

  if (!delivery || delivery.status === "success") {
    return null;
  }

  // Get app webhook config
  const [appConfig] = await db
    .select({
      webhookUrl: app.webhookUrl,
      webhookSecret: app.webhookSecret,
    })
    .from(app)
    .where(eq(app.id, delivery.appId))
    .limit(1);

  if (!appConfig?.webhookUrl) {
    return null;
  }

  // Re-sign and resend
  const signature = signPayload(delivery.payload, appConfig.webhookSecret || "");
  const startTime = Date.now();

  try {
    const response = await fetch(appConfig.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CroissantPay-Signature": signature,
        "X-CroissantPay-Event": delivery.eventType,
        "X-CroissantPay-Timestamp": new Date().toISOString(),
        "X-CroissantPay-Delivery-ID": delivery.id,
        "X-CroissantPay-Retry": "true",
        "User-Agent": "CroissantPay-Webhook/1.0",
      },
      body: JSON.stringify(delivery.payload),
      signal: AbortSignal.timeout(30000),
    });

    const duration = Date.now() - startTime;
    let responseBody: string | undefined;

    try {
      responseBody = await response.text();
    } catch {
      // Ignore
    }

    await db
      .update(webhookDelivery)
      .set({
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        responseBody: responseBody?.substring(0, 10000),
        duration,
        deliveredAt: response.ok ? new Date() : null,
        errorMessage: response.ok ? null : `HTTP ${response.status}`,
        attemptCount: delivery.attemptCount + 1,
      })
      .where(eq(webhookDelivery.id, deliveryId));

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      duration,
      deliveryId,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(webhookDelivery)
      .set({
        status: "failed",
        errorMessage,
        duration,
        attemptCount: delivery.attemptCount + 1,
      })
      .where(eq(webhookDelivery.id, deliveryId));

    return {
      success: false,
      error: errorMessage,
      duration,
      deliveryId,
    };
  }
}

