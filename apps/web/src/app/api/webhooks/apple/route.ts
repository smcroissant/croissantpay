import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  app,
  webhookEvent,
  subscription,
  product,
  subscriber,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AppleStoreClient, AppleNotificationPayload } from "@/lib/stores/apple";
import { refreshEntitlements } from "@/lib/services/entitlements";

// Apple App Store Server Notifications v2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signedPayload = body.signedPayload;

    if (!signedPayload) {
      return NextResponse.json(
        { error: "Missing signedPayload" },
        { status: 400 }
      );
    }

    // Decode the notification (in production, verify signature with Apple's keys)
    const parts = signedPayload.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: "Invalid JWS format" },
        { status: 400 }
      );
    }

    const payload: AppleNotificationPayload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    const { notificationType, subtype, data, notificationUUID } = payload;
    const bundleId = data.bundleId;

    // Find the app by bundle ID
    const [appConfig] = await db
      .select()
      .from(app)
      .where(eq(app.bundleId, bundleId))
      .limit(1);

    if (!appConfig) {
      console.warn(`No app found for bundle ID: ${bundleId}`);
      // Return 200 to prevent Apple from retrying
      return NextResponse.json({ received: true });
    }

    // Log the webhook event
    await db.insert(webhookEvent).values({
      appId: appConfig.id,
      platform: "ios",
      eventType: subtype ? `${notificationType}.${subtype}` : notificationType,
      eventId: notificationUUID,
      payload: payload as unknown as Record<string, unknown>,
    });

    // Process the notification
    await processAppleNotification(appConfig, payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Apple webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function processAppleNotification(
  appConfig: typeof app.$inferSelect,
  payload: AppleNotificationPayload
): Promise<void> {
  const { notificationType, subtype, data } = payload;

  // Decode transaction info if present
  let transactionInfo = null;
  if (data.signedTransactionInfo) {
    const client = new AppleStoreClient({
      issuerId: appConfig.appleIssuerId || "",
      keyId: appConfig.appleKeyId || "",
      privateKey: appConfig.applePrivateKey || "",
      bundleId: appConfig.bundleId || "",
    });
    transactionInfo = await client.decodeTransaction(data.signedTransactionInfo);
  }

  if (!transactionInfo) {
    console.warn("No transaction info in notification");
    return;
  }

  // Find the subscription by original transaction ID
  const [existingSub] = await db
    .select({ subscription: subscription, subscriber: subscriber })
    .from(subscription)
    .leftJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
    .where(
      and(
        eq(subscription.platform, "ios"),
        eq(subscription.originalTransactionId, transactionInfo.originalTransactionId)
      )
    )
    .limit(1);

  if (!existingSub?.subscriber) {
    console.warn(
      `No subscription found for original transaction: ${transactionInfo.originalTransactionId}`
    );
    return;
  }

  // Decode renewal info if present
  let renewalInfo = null;
  if (data.signedRenewalInfo) {
    const client = new AppleStoreClient({
      issuerId: appConfig.appleIssuerId || "",
      keyId: appConfig.appleKeyId || "",
      privateKey: appConfig.applePrivateKey || "",
      bundleId: appConfig.bundleId || "",
    });
    renewalInfo = await client.decodeRenewalInfo(data.signedRenewalInfo);
  }

  // Update subscription based on notification type
  const updateData: Partial<typeof subscription.$inferInsert> = {
    latestTransactionId: transactionInfo.transactionId,
    updatedAt: new Date(),
  };

  switch (notificationType) {
    case "SUBSCRIBED":
      updateData.status = "active";
      updateData.purchaseDate = new Date(transactionInfo.purchaseDate);
      if (transactionInfo.expiresDate) {
        updateData.expiresDate = new Date(transactionInfo.expiresDate);
      }
      break;

    case "DID_RENEW":
      updateData.status = "active";
      updateData.purchaseDate = new Date(transactionInfo.purchaseDate);
      if (transactionInfo.expiresDate) {
        updateData.expiresDate = new Date(transactionInfo.expiresDate);
      }
      updateData.isTrialPeriod = false;
      updateData.isInIntroOfferPeriod = false;
      break;

    case "DID_CHANGE_RENEWAL_STATUS":
      updateData.autoRenewEnabled = renewalInfo?.autoRenewStatus === 1;
      if (subtype === "AUTO_RENEW_DISABLED") {
        updateData.canceledAt = new Date();
      }
      break;

    case "DID_FAIL_TO_RENEW":
      if (subtype === "GRACE_PERIOD") {
        updateData.status = "in_grace_period";
        if (renewalInfo?.gracePeriodExpiresDate) {
          updateData.gracePeriodExpiresDate = new Date(
            renewalInfo.gracePeriodExpiresDate
          );
        }
      } else {
        updateData.status = "in_billing_retry";
      }
      break;

    case "GRACE_PERIOD_EXPIRED":
      updateData.status = "in_billing_retry";
      updateData.gracePeriodExpiresDate = null;
      break;

    case "EXPIRED":
      updateData.status = "expired";
      break;

    case "REFUND":
      updateData.status = "revoked";
      updateData.canceledAt = new Date();
      updateData.cancellationReason = "refund";
      break;

    case "REVOKE":
      updateData.status = "revoked";
      updateData.canceledAt = new Date();
      updateData.cancellationReason = subtype || "revoked";
      break;

    case "OFFER_REDEEMED":
      updateData.status = "active";
      updateData.isTrialPeriod = transactionInfo.offerType === 1;
      updateData.isInIntroOfferPeriod = transactionInfo.offerType === 2;
      break;
  }

  // Update subscription
  await db
    .update(subscription)
    .set(updateData)
    .where(eq(subscription.id, existingSub.subscription.id));

  // Refresh entitlements for the subscriber
  await refreshEntitlements(existingSub.subscriber.id);

  // Mark webhook as processed
  await db
    .update(webhookEvent)
    .set({ processedAt: new Date() })
    .where(eq(webhookEvent.eventId, payload.notificationUUID));
}

