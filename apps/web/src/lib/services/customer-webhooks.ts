import { db } from "@/lib/db";
import { app, webhookEvent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Customer webhook event types
export type CustomerWebhookEvent =
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

export interface CustomerWebhookPayload {
  id: string;
  type: CustomerWebhookEvent;
  timestamp: string;
  appId: string;
  data: {
    subscriberId: string;
    appUserId: string;
    [key: string]: unknown;
  };
}

interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  duration: number;
}

// Send webhook to customer's server
export async function sendCustomerWebhook(
  appId: string,
  event: CustomerWebhookEvent,
  data: Record<string, unknown>
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

  // Build payload
  const payload: CustomerWebhookPayload = {
    id: `evt_${crypto.randomBytes(16).toString("hex")}`,
    type: event,
    timestamp: new Date().toISOString(),
    appId,
    data: data as CustomerWebhookPayload["data"],
  };

  // Sign payload
  const signature = signPayload(payload, appConfig.webhookSecret || "");

  const startTime = Date.now();

  try {
    const response = await fetch(appConfig.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CroissantPay-Signature": signature,
        "X-CroissantPay-Event": event,
        "X-CroissantPay-Timestamp": payload.timestamp,
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

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration,
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
  event: CustomerWebhookEvent,
  data: Record<string, unknown>,
  maxRetries: number = 3
): Promise<void> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendCustomerWebhook(appId, event, data);

    if (result === null) {
      // No webhook configured, skip
      return;
    }

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

    // Exponential backoff
    if (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  console.error(
    `[Webhook] Failed to deliver ${event} to app ${appId} after ${maxRetries} attempts: ${lastError}`
  );
}

// Helper to trigger webhooks for subscription events
export async function triggerSubscriptionWebhook(
  appId: string,
  event: CustomerWebhookEvent,
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
  await queueCustomerWebhook(appId, event, {
    subscriberId,
    appUserId,
    ...subscriptionData,
    expiresDate: subscriptionData.expiresDate?.toISOString(),
  });
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
  await queueCustomerWebhook(appId, event, {
    subscriberId,
    appUserId,
    ...entitlementData,
    expiresDate: entitlementData.expiresDate?.toISOString(),
  });
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
  await queueCustomerWebhook(appId, event, {
    subscriberId,
    appUserId,
    ...purchaseData,
    purchaseDate: purchaseData.purchaseDate.toISOString(),
  });
}

// Generate a new webhook secret
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}

