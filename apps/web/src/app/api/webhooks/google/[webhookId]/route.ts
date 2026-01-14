import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  app,
  webhookEvent,
  subscription,
  subscriber,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  GooglePlayClient,
  GoogleRTDNPayload,
  SUBSCRIPTION_NOTIFICATION_TYPE,
} from "@/lib/stores/google";
import { refreshEntitlements } from "@/lib/services/entitlements";
import { getAppByGoogleWebhookId } from "@/lib/services/apps";

// Google Play Real-time Developer Notifications with secure webhook ID
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;

    // Find app by webhook ID
    const appConfig = await getAppByGoogleWebhookId(webhookId);

    if (!appConfig) {
      console.warn(`No app found for Google webhook ID: ${webhookId}`);
      return NextResponse.json(
        { error: "Invalid webhook ID" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Google Pub/Sub sends base64 encoded data in message.data
    const message = body.message;
    if (!message?.data) {
      return NextResponse.json(
        { error: "Missing message data" },
        { status: 400 }
      );
    }

    // Decode the RTDN payload
    const payload = GooglePlayClient.decodeRTDNPayload(message.data);

    // Verify package name matches the app (extra security check)
    if (appConfig.packageName && payload.packageName !== appConfig.packageName) {
      console.warn(
        `Package name mismatch: expected ${appConfig.packageName}, got ${payload.packageName}`
      );
      return NextResponse.json(
        { error: "Package name mismatch" },
        { status: 400 }
      );
    }

    // Determine event type
    let eventType = "UNKNOWN";
    if (payload.subscriptionNotification) {
      eventType = `SUBSCRIPTION_${payload.subscriptionNotification.notificationType}`;
    } else if (payload.oneTimeProductNotification) {
      eventType = `ONE_TIME_${payload.oneTimeProductNotification.notificationType}`;
    } else if (payload.voidedPurchaseNotification) {
      eventType = "VOIDED_PURCHASE";
    } else if (payload.testNotification) {
      eventType = "TEST";
    }

    // Log the webhook event
    const [webhookRecord] = await db
      .insert(webhookEvent)
      .values({
        appId: appConfig.id,
        platform: "android",
        eventType,
        eventId: message.messageId,
        payload: payload as unknown as Record<string, unknown>,
      })
      .returning();

    // Process the notification
    await processGoogleNotification(appConfig, payload, webhookRecord.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Google webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processGoogleNotification(
  appConfig: typeof app.$inferSelect,
  payload: GoogleRTDNPayload,
  webhookRecordId: string
): Promise<void> {
  // Handle test notification
  if (payload.testNotification) {
    console.log("Received Google test notification");
    await markWebhookProcessed(webhookRecordId);
    return;
  }

  // Handle subscription notifications
  if (payload.subscriptionNotification) {
    await processSubscriptionNotification(
      appConfig,
      payload.subscriptionNotification,
      webhookRecordId
    );
    return;
  }

  // Handle one-time product notifications
  if (payload.oneTimeProductNotification) {
    await processOneTimeNotification(
      appConfig,
      payload.oneTimeProductNotification,
      webhookRecordId
    );
    return;
  }

  // Handle voided purchase notifications
  if (payload.voidedPurchaseNotification) {
    await processVoidedPurchase(
      appConfig,
      payload.voidedPurchaseNotification,
      webhookRecordId
    );
    return;
  }
}

async function processSubscriptionNotification(
  appConfig: typeof app.$inferSelect,
  notification: NonNullable<GoogleRTDNPayload["subscriptionNotification"]>,
  webhookRecordId: string
): Promise<void> {
  const { notificationType, purchaseToken, subscriptionId } = notification;

  if (!appConfig.googleServiceAccount || !appConfig.packageName) {
    console.error("Google Play not configured for this app");
    return;
  }

  // Find the subscription by purchase token (stored as originalTransactionId)
  const [existingSub] = await db
    .select({ subscription: subscription, subscriber: subscriber })
    .from(subscription)
    .leftJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
    .where(
      and(
        eq(subscription.platform, "android"),
        eq(subscription.originalTransactionId, purchaseToken)
      )
    )
    .limit(1);

  // For new subscriptions, we need to find by product
  let sub = existingSub;

  if (!sub && notificationType === SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PURCHASED) {
    // New subscription - we'll need to wait for the client to sync
    console.log(`New subscription notification received for ${subscriptionId}`);
    await markWebhookProcessed(webhookRecordId);
    return;
  }

  if (!sub?.subscriber) {
    console.warn(`No subscription found for purchase token: ${purchaseToken}`);
    await markWebhookProcessed(webhookRecordId);
    return;
  }

  // Fetch latest subscription details from Google
  const client = new GooglePlayClient({
    serviceAccountKey: appConfig.googleServiceAccount,
    packageName: appConfig.packageName,
  });

  try {
    const googleSub = await client.getSubscriptionV2(purchaseToken);
    const status = GooglePlayClient.mapSubscriptionStatus(googleSub.subscriptionState);
    const lineItem = googleSub.lineItems?.[0];

    const updateData: Partial<typeof subscription.$inferInsert> = {
      status,
      latestTransactionId: googleSub.latestOrderId,
      updatedAt: new Date(),
    };

    if (lineItem?.expiryTime) {
      updateData.expiresDate = new Date(lineItem.expiryTime);
    }

    if (lineItem?.autoRenewingPlan) {
      updateData.autoRenewEnabled = lineItem.autoRenewingPlan.autoRenewEnabled;
    }

    // Handle specific notification types
    switch (notificationType) {
      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_RECOVERED:
        updateData.status = "active";
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_RENEWED:
        updateData.status = "active";
        updateData.purchaseDate = new Date(googleSub.startTime);
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_CANCELED:
        updateData.canceledAt = new Date();
        if (googleSub.canceledStateContext?.userInitiatedCancellation) {
          updateData.cancellationReason = "user_canceled";
        } else if (googleSub.canceledStateContext?.systemInitiatedCancellation) {
          updateData.cancellationReason = "system_canceled";
        } else if (googleSub.canceledStateContext?.developerInitiatedCancellation) {
          updateData.cancellationReason = "developer_canceled";
        }
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_ON_HOLD:
        updateData.status = "in_billing_retry";
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_IN_GRACE_PERIOD:
        updateData.status = "in_grace_period";
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_PAUSED:
        updateData.status = "paused";
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRED:
        updateData.status = "expired";
        break;

      case SUBSCRIPTION_NOTIFICATION_TYPE.SUBSCRIPTION_REVOKED:
        updateData.status = "revoked";
        updateData.canceledAt = new Date();
        updateData.cancellationReason = "revoked";
        break;
    }

    // Update subscription
    await db
      .update(subscription)
      .set(updateData)
      .where(eq(subscription.id, sub.subscription.id));

    // Refresh entitlements
    await refreshEntitlements(sub.subscriber.id);
  } catch (error) {
    console.error("Error fetching subscription from Google:", error);
  }

  await markWebhookProcessed(webhookRecordId);
}

async function processOneTimeNotification(
  appConfig: typeof app.$inferSelect,
  notification: NonNullable<GoogleRTDNPayload["oneTimeProductNotification"]>,
  webhookRecordId: string
): Promise<void> {
  // One-time products are typically synced via client SDK
  // This is mainly for logging and analytics
  console.log(
    `One-time product notification: ${notification.notificationType} for ${notification.sku}`
  );
  await markWebhookProcessed(webhookRecordId);
}

async function processVoidedPurchase(
  appConfig: typeof app.$inferSelect,
  notification: NonNullable<GoogleRTDNPayload["voidedPurchaseNotification"]>,
  webhookRecordId: string
): Promise<void> {
  const { purchaseToken } = notification;

  // Find and update the subscription
  const [existingSub] = await db
    .select({ subscription: subscription, subscriber: subscriber })
    .from(subscription)
    .leftJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
    .where(
      and(
        eq(subscription.platform, "android"),
        eq(subscription.originalTransactionId, purchaseToken)
      )
    )
    .limit(1);

  if (existingSub?.subscriber) {
    await db
      .update(subscription)
      .set({
        status: "revoked",
        canceledAt: new Date(),
        cancellationReason: "voided",
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, existingSub.subscription.id));

    await refreshEntitlements(existingSub.subscriber.id);
  }

  await markWebhookProcessed(webhookRecordId);
}

async function markWebhookProcessed(webhookRecordId: string): Promise<void> {
  await db
    .update(webhookEvent)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvent.id, webhookRecordId));
}
