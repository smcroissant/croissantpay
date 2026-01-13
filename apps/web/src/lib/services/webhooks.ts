import { db } from "@/lib/db";
import { webhookEvent } from "@/lib/db/schema";
import { eq, desc, and, isNull, isNotNull, sql } from "drizzle-orm";

export type WebhookEventType =
  // Apple events
  | "SUBSCRIBED"
  | "DID_RENEW"
  | "DID_FAIL_TO_RENEW"
  | "DID_CHANGE_RENEWAL_STATUS"
  | "EXPIRED"
  | "REFUND"
  | "GRACE_PERIOD_EXPIRED"
  | "OFFER_REDEEMED"
  | "PRICE_INCREASE"
  // Google events
  | "SUBSCRIPTION_PURCHASED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_RECOVERED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_ON_HOLD"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_REVOKED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_RESTARTED";

export interface WebhookEventRecord {
  id: string;
  appId: string;
  platform: "ios" | "android";
  eventType: string;
  eventId: string | null;
  payload: Record<string, unknown>;
  processedAt: Date | null;
  error: string | null;
  retryCount: number;
  createdAt: Date;
}

// Record incoming webhook event
export async function recordWebhookEvent(
  appId: string,
  platform: "ios" | "android",
  eventType: string,
  payload: Record<string, unknown>,
  eventId?: string
): Promise<string> {
  const [event] = await db
    .insert(webhookEvent)
    .values({
      appId,
      platform,
      eventType,
      eventId,
      payload,
    })
    .returning({ id: webhookEvent.id });

  return event.id;
}

// Mark event as processed
export async function markEventProcessed(eventId: string): Promise<void> {
  await db
    .update(webhookEvent)
    .set({
      processedAt: new Date(),
      error: null,
    })
    .where(eq(webhookEvent.id, eventId));
}

// Mark event as failed
export async function markEventFailed(
  eventId: string,
  errorMessage: string
): Promise<void> {
  const [event] = await db
    .select({ retryCount: webhookEvent.retryCount })
    .from(webhookEvent)
    .where(eq(webhookEvent.id, eventId))
    .limit(1);

  await db
    .update(webhookEvent)
    .set({
      error: errorMessage,
      retryCount: (event?.retryCount || 0) + 1,
    })
    .where(eq(webhookEvent.id, eventId));
}

// Get recent webhook events for an app
export async function getRecentWebhookEvents(
  appId: string,
  limit: number = 50
): Promise<WebhookEventRecord[]> {
  const events = await db
    .select()
    .from(webhookEvent)
    .where(eq(webhookEvent.appId, appId))
    .orderBy(desc(webhookEvent.createdAt))
    .limit(limit);

  return events as WebhookEventRecord[];
}

// Get webhook events by status
export async function getWebhookEventsByStatus(
  appId: string,
  status: "pending" | "processed" | "failed"
): Promise<WebhookEventRecord[]> {
  let condition;
  if (status === "processed") {
    condition = and(eq(webhookEvent.appId, appId), isNotNull(webhookEvent.processedAt), isNull(webhookEvent.error));
  } else if (status === "failed") {
    condition = and(eq(webhookEvent.appId, appId), isNotNull(webhookEvent.error));
  } else {
    condition = and(eq(webhookEvent.appId, appId), isNull(webhookEvent.processedAt));
  }

  const events = await db
    .select()
    .from(webhookEvent)
    .where(condition)
    .orderBy(desc(webhookEvent.createdAt))
    .limit(100);

  return events as WebhookEventRecord[];
}

// Get webhook stats
export async function getWebhookStats(appId: string): Promise<{
  total: number;
  processed: number;
  failed: number;
  pending: number;
  last24Hours: number;
}> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      processed: sql<number>`count(*) filter (where ${webhookEvent.processedAt} is not null and ${webhookEvent.error} is null)`,
      failed: sql<number>`count(*) filter (where ${webhookEvent.error} is not null)`,
      pending: sql<number>`count(*) filter (where ${webhookEvent.processedAt} is null)`,
      last24Hours: sql<number>`count(*) filter (where ${webhookEvent.createdAt} >= ${oneDayAgo}::timestamp)`,
    })
    .from(webhookEvent)
    .where(eq(webhookEvent.appId, appId));

  return {
    total: Number(stats?.total || 0),
    processed: Number(stats?.processed || 0),
    failed: Number(stats?.failed || 0),
    pending: Number(stats?.pending || 0),
    last24Hours: Number(stats?.last24Hours || 0),
  };
}

// Retry failed webhook event
export async function retryWebhookEvent(eventId: string): Promise<void> {
  await db
    .update(webhookEvent)
    .set({
      error: null,
      processedAt: null,
    })
    .where(eq(webhookEvent.id, eventId));
}

// Generate test webhook payload
export function generateTestWebhookPayload(
  platform: "ios" | "android",
  eventType: string,
  options: {
    productId?: string;
    transactionId?: string;
    originalTransactionId?: string;
    subscriptionId?: string;
  } = {}
): Record<string, unknown> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  if (platform === "ios") {
    return {
      notificationType: eventType,
      subtype: eventType === "DID_CHANGE_RENEWAL_STATUS" ? "AUTO_RENEW_DISABLED" : undefined,
      notificationUUID: `test-${Date.now()}`,
      data: {
        signedTransactionInfo: "test_signed_transaction",
        signedRenewalInfo: "test_signed_renewal",
        appAppleId: 123456789,
        bundleId: "com.example.app",
        bundleVersion: "1.0.0",
        environment: "Sandbox",
      },
      // Decoded transaction info for testing
      _decoded: {
        transactionId: options.transactionId || `T${Date.now()}`,
        originalTransactionId: options.originalTransactionId || `OT${Date.now()}`,
        productId: options.productId || "com.example.subscription.monthly",
        purchaseDate: now.toISOString(),
        expiresDate: expiresAt.toISOString(),
        quantity: 1,
        type: "Auto-Renewable Subscription",
        inAppOwnershipType: "PURCHASED",
      },
      version: "2.0",
      signedDate: now.getTime(),
    };
  } else {
    // Google RTDN payload
    return {
      message: {
        data: Buffer.from(
          JSON.stringify({
            version: "1.0",
            packageName: "com.example.app",
            eventTimeMillis: now.getTime().toString(),
            subscriptionNotification: {
              version: "1.0",
              notificationType: getGoogleNotificationType(eventType),
              purchaseToken: options.transactionId || `purchase_token_${Date.now()}`,
              subscriptionId: options.subscriptionId || options.productId || "monthly_subscription",
            },
          })
        ).toString("base64"),
        messageId: `msg-${Date.now()}`,
        publishTime: now.toISOString(),
      },
      subscription: "projects/test-project/subscriptions/test-subscription",
      // Decoded for testing
      _decoded: {
        packageName: "com.example.app",
        subscriptionId: options.subscriptionId || options.productId || "monthly_subscription",
        purchaseToken: options.transactionId || `purchase_token_${Date.now()}`,
        eventType,
        eventTimeMillis: now.getTime(),
      },
    };
  }
}

function getGoogleNotificationType(eventType: string): number {
  const types: Record<string, number> = {
    SUBSCRIPTION_RECOVERED: 1,
    SUBSCRIPTION_RENEWED: 2,
    SUBSCRIPTION_CANCELED: 3,
    SUBSCRIPTION_PURCHASED: 4,
    SUBSCRIPTION_ON_HOLD: 5,
    SUBSCRIPTION_IN_GRACE_PERIOD: 6,
    SUBSCRIPTION_RESTARTED: 7,
    SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
    SUBSCRIPTION_DEFERRED: 9,
    SUBSCRIPTION_PAUSED: 10,
    SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
    SUBSCRIPTION_REVOKED: 12,
    SUBSCRIPTION_EXPIRED: 13,
  };
  return types[eventType] || 4;
}

