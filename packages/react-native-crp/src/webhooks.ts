/**
 * Webhook verification utilities for server-side use
 * Use this in your backend to verify CroissantPay webhook signatures
 */

import crypto from "crypto";

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  appId: string;
  data: {
    subscriberId: string;
    appUserId: string;
    [key: string]: unknown;
  };
}

/**
 * Verify a CroissantPay webhook signature
 *
 * @param payload - The raw request body as a string
 * @param signature - The X-CroissantPay-Signature header value
 * @param secret - Your webhook secret (starts with whsec_)
 * @returns true if the signature is valid
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@croissantpay/react-native/webhooks';
 *
 * app.post('/webhooks/croissantpay', (req, res) => {
 *   const signature = req.headers['x-croissantpay-signature'];
 *   const payload = req.body; // raw body string
 *
 *   if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
 *     return res.status(401).send('Invalid signature');
 *   }
 *
 *   const event = JSON.parse(payload);
 *   // Handle the event...
 * });
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = computeSignature(payload, secret);
  const providedSignature = signature.replace("sha256=", "");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Compute the expected signature for a payload
 */
export function computeSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Parse and validate a webhook event
 *
 * @param payload - The raw request body as a string
 * @param signature - The X-CroissantPay-Signature header value
 * @param secret - Your webhook secret
 * @returns The parsed webhook event
 * @throws Error if signature is invalid
 */
export function constructEvent(
  payload: string,
  signature: string,
  secret: string
): WebhookEvent {
  if (!verifyWebhookSignature(payload, signature, secret)) {
    throw new Error("Invalid webhook signature");
  }

  try {
    return JSON.parse(payload) as WebhookEvent;
  } catch {
    throw new Error("Invalid webhook payload");
  }
}

// Event type constants
export const WebhookEventTypes = {
  // Subscriber events
  SUBSCRIBER_CREATED: "subscriber.created",
  SUBSCRIBER_UPDATED: "subscriber.updated",

  // Subscription events
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_RENEWED: "subscription.renewed",
  SUBSCRIPTION_CANCELED: "subscription.canceled",
  SUBSCRIPTION_EXPIRED: "subscription.expired",
  SUBSCRIPTION_BILLING_ISSUE: "subscription.billing_issue",
  SUBSCRIPTION_PRODUCT_CHANGE: "subscription.product_change",

  // Entitlement events
  ENTITLEMENT_GRANTED: "entitlement.granted",
  ENTITLEMENT_REVOKED: "entitlement.revoked",

  // Purchase events
  PURCHASE_COMPLETED: "purchase.completed",
  PURCHASE_REFUNDED: "purchase.refunded",

  // Trial events
  TRIAL_STARTED: "trial.started",
  TRIAL_CONVERTED: "trial.converted",
  TRIAL_EXPIRED: "trial.expired",
} as const;

export type WebhookEventType =
  (typeof WebhookEventTypes)[keyof typeof WebhookEventTypes];

