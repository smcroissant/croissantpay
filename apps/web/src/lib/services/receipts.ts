import { db } from "@/lib/db";
import {
  app,
  product,
  purchase,
  subscription,
  subscriber,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  AppleStoreClient,
  AppleTransaction,
  SUBSCRIPTION_STATUS,
} from "@/lib/stores/apple";
import { GooglePlayClient, GoogleSubscriptionPurchaseV2 } from "@/lib/stores/google";
import { getOrCreateSubscriber, getSubscriberInfo, SubscriberInfo } from "./subscribers";
import { grantEntitlementsForProduct, refreshEntitlements } from "./entitlements";
import { triggerPurchaseWebhook, triggerSubscriptionWebhook } from "./customer-webhooks";

export interface ReceiptValidationResult {
  success: boolean;
  subscriberInfo: SubscriberInfo | null;
  error?: string;
}

// Validate iOS receipt and sync with database
export async function validateiOSReceipt(
  appConfig: typeof app.$inferSelect,
  appUserId: string,
  transactionId: string
): Promise<ReceiptValidationResult> {
  if (!appConfig.appleIssuerId || !appConfig.appleKeyId || !appConfig.applePrivateKey) {
    return {
      success: false,
      subscriberInfo: null,
      error: "Apple App Store not configured for this app",
    };
  }

  try {
    const client = new AppleStoreClient({
      issuerId: appConfig.appleIssuerId,
      keyId: appConfig.appleKeyId,
      privateKey: appConfig.applePrivateKey,
      bundleId: appConfig.bundleId || "",
    });

    // Get transaction info from Apple
    const transaction = await client.getTransactionInfo(transactionId);

    // Get or create subscriber
    const sub = await getOrCreateSubscriber(appConfig.id, appUserId);

    // Find product in our database
    const [prod] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.appId, appConfig.id),
          eq(product.storeProductId, transaction.productId),
          eq(product.platform, "ios")
        )
      )
      .limit(1);

    if (!prod) {
      return {
        success: false,
        subscriberInfo: null,
        error: `Product ${transaction.productId} not found in CroissantPay`,
      };
    }

    // Process based on transaction type
    if (transaction.type === "Auto-Renewable Subscription") {
      await processiOSSubscription(sub, prod, transaction, client);
    } else {
      await processiOSPurchase(sub, prod, transaction);
    }

    // Refresh entitlements
    await refreshEntitlements(sub.id);

    // Get updated subscriber info
    const subscriberInfo = await getSubscriberInfo(appConfig.id, appUserId);

    // Trigger customer webhook for the purchase
    if (subscriberInfo) {
      const isSubscriptionPurchase = prod.type.includes("subscription");
      if (isSubscriptionPurchase) {
        triggerSubscriptionWebhook(
          appConfig.id,
          "subscription.created",
          sub.id,
          appUserId,
          {
            productIdentifier: prod.identifier,
            productId: prod.id,
          }
        );
      } else {
        triggerPurchaseWebhook(
          appConfig.id,
          "purchase.completed",
          sub.id,
          appUserId,
          {
            transactionId: transactionId,
            productIdentifier: prod.identifier,
            purchaseDate: new Date(),
          }
        );
      }
    }

    return {
      success: true,
      subscriberInfo,
    };
  } catch (error) {
    console.error("iOS receipt validation error:", error);
    return {
      success: false,
      subscriberInfo: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function processiOSSubscription(
  sub: typeof subscriber.$inferSelect,
  prod: typeof product.$inferSelect,
  transaction: AppleTransaction,
  client: AppleStoreClient
): Promise<void> {
  // Get subscription status for renewal info
  let status: "active" | "expired" | "in_billing_retry" | "in_grace_period" | "revoked" = "active";
  let autoRenewEnabled = true;

  try {
    const subscriptionStatus = await client.getSubscriptionStatus(
      transaction.originalTransactionId
    );

    // Find the matching subscription group
    const subData = subscriptionStatus.data.find((d) =>
      d.lastTransactions.some(
        (t) => t.originalTransactionId === transaction.originalTransactionId
      )
    );

    if (subData) {
      const lastTx = subData.lastTransactions.find(
        (t) => t.originalTransactionId === transaction.originalTransactionId
      );
      if (lastTx) {
        status = AppleStoreClient.mapSubscriptionStatus(lastTx.status);
        
        // Decode renewal info
        const renewalInfo = await client.decodeRenewalInfo(
          lastTx.signedRenewalInfo
        );
        autoRenewEnabled = renewalInfo.autoRenewStatus === 1;
      }
    }
  } catch (error) {
    console.error("Error fetching subscription status:", error);
  }

  // Check if subscription exists
  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.platform, "ios"),
        eq(subscription.originalTransactionId, transaction.originalTransactionId)
      )
    )
    .limit(1);

  const subscriptionData = {
    subscriberId: sub.id,
    productId: prod.id,
    platform: "ios" as const,
    originalTransactionId: transaction.originalTransactionId,
    latestTransactionId: transaction.transactionId,
    status,
    purchaseDate: new Date(transaction.purchaseDate),
    originalPurchaseDate: new Date(transaction.originalPurchaseDate),
    expiresDate: transaction.expiresDate
      ? new Date(transaction.expiresDate)
      : null,
    autoRenewEnabled,
    isTrialPeriod: transaction.offerType === 1,
    isInIntroOfferPeriod: transaction.offerType === 2,
    environment: transaction.environment.toLowerCase(),
    storeResponse: transaction as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };

  if (existingSub) {
    await db
      .update(subscription)
      .set(subscriptionData)
      .where(eq(subscription.id, existingSub.id));
  } else {
    await db.insert(subscription).values(subscriptionData);
  }

  // Also record the purchase/transaction
  await recordPurchase(sub, prod, {
    platform: "ios",
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
    purchaseDate: new Date(transaction.purchaseDate),
    expiresDate: transaction.expiresDate
      ? new Date(transaction.expiresDate)
      : undefined,
    priceAmountMicros: transaction.price
      ? Math.round(transaction.price * 1_000_000)
      : undefined,
    priceCurrencyCode: transaction.currency,
    environment: transaction.environment.toLowerCase(),
    storeResponse: transaction as unknown as Record<string, unknown>,
  });
}

async function processiOSPurchase(
  sub: typeof subscriber.$inferSelect,
  prod: typeof product.$inferSelect,
  transaction: AppleTransaction
): Promise<void> {
  await recordPurchase(sub, prod, {
    platform: "ios",
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
    purchaseDate: new Date(transaction.purchaseDate),
    priceAmountMicros: transaction.price
      ? Math.round(transaction.price * 1_000_000)
      : undefined,
    priceCurrencyCode: transaction.currency,
    environment: transaction.environment.toLowerCase(),
    storeResponse: transaction as unknown as Record<string, unknown>,
  });

  // For non-consumables, grant entitlements immediately
  if (prod.type === "non_consumable") {
    const [purchaseRecord] = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.platform, "ios"),
          eq(purchase.storeTransactionId, transaction.transactionId)
        )
      )
      .limit(1);

    if (purchaseRecord) {
      await grantEntitlementsForProduct(sub.id, prod.id, {
        purchaseId: purchaseRecord.id,
      });
    }
  }
}

// Validate Android purchase and sync with database
export async function validateAndroidReceipt(
  appConfig: typeof app.$inferSelect,
  appUserId: string,
  purchaseToken: string,
  productId: string,
  isSubscription: boolean
): Promise<ReceiptValidationResult> {
  if (!appConfig.googleServiceAccount || !appConfig.packageName) {
    return {
      success: false,
      subscriberInfo: null,
      error: "Google Play not configured for this app",
    };
  }

  try {
    const client = new GooglePlayClient({
      serviceAccountKey: appConfig.googleServiceAccount,
      packageName: appConfig.packageName,
    });

    // Get or create subscriber
    const sub = await getOrCreateSubscriber(appConfig.id, appUserId);

    // Find product in our database
    const [prod] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.appId, appConfig.id),
          eq(product.storeProductId, productId),
          eq(product.platform, "android")
        )
      )
      .limit(1);

    if (!prod) {
      return {
        success: false,
        subscriberInfo: null,
        error: `Product ${productId} not found in CroissantPay`,
      };
    }

    if (isSubscription) {
      await processAndroidSubscription(sub, prod, purchaseToken, client);
    } else {
      await processAndroidPurchase(sub, prod, purchaseToken, productId, client);
    }

    // Refresh entitlements
    await refreshEntitlements(sub.id);

    // Get updated subscriber info
    const subscriberInfo = await getSubscriberInfo(appConfig.id, appUserId);

    // Trigger customer webhook for the purchase
    if (subscriberInfo) {
      if (isSubscription) {
        triggerSubscriptionWebhook(
          appConfig.id,
          "subscription.created",
          sub.id,
          appUserId,
          {
            productIdentifier: prod.identifier,
            productId: prod.id,
          }
        );
      } else {
        triggerPurchaseWebhook(
          appConfig.id,
          "purchase.completed",
          sub.id,
          appUserId,
          {
            transactionId: purchaseToken,
            productIdentifier: prod.identifier,
            purchaseDate: new Date(),
          }
        );
      }
    }

    return {
      success: true,
      subscriberInfo,
    };
  } catch (error) {
    console.error("Android receipt validation error:", error);
    return {
      success: false,
      subscriberInfo: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function processAndroidSubscription(
  sub: typeof subscriber.$inferSelect,
  prod: typeof product.$inferSelect,
  purchaseToken: string,
  client: GooglePlayClient
): Promise<void> {
  // Get subscription details from Google
  const googleSub = await client.getSubscriptionV2(purchaseToken);

  // Acknowledge if not already acknowledged
  if (googleSub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    await client.acknowledgeSubscription(prod.storeProductId, purchaseToken);
  }

  const status = GooglePlayClient.mapSubscriptionStatus(googleSub.subscriptionState);
  const lineItem = googleSub.lineItems?.[0];

  // Check if subscription exists (by purchase token pattern)
  const [existingSub] = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.platform, "android"),
        eq(subscription.subscriberId, sub.id),
        eq(subscription.productId, prod.id)
      )
    )
    .limit(1);

  const expiresDate = lineItem?.expiryTime
    ? new Date(lineItem.expiryTime)
    : null;

  const subscriptionData = {
    subscriberId: sub.id,
    productId: prod.id,
    platform: "android" as const,
    originalTransactionId: purchaseToken,
    latestTransactionId: googleSub.latestOrderId,
    status,
    purchaseDate: new Date(googleSub.startTime),
    originalPurchaseDate: new Date(googleSub.startTime),
    expiresDate,
    autoRenewEnabled: lineItem?.autoRenewingPlan?.autoRenewEnabled ?? false,
    isTrialPeriod: false, // Would need to check offer details
    isInIntroOfferPeriod: false,
    environment: googleSub.testPurchase ? "sandbox" : "production",
    storeResponse: googleSub as unknown as Record<string, unknown>,
    updatedAt: new Date(),
  };

  if (existingSub) {
    await db
      .update(subscription)
      .set(subscriptionData)
      .where(eq(subscription.id, existingSub.id));
  } else {
    await db.insert(subscription).values(subscriptionData);
  }

  // Record purchase
  await recordPurchase(sub, prod, {
    platform: "android",
    transactionId: googleSub.latestOrderId,
    originalTransactionId: purchaseToken,
    purchaseDate: new Date(googleSub.startTime),
    expiresDate: expiresDate ?? undefined,
    environment: googleSub.testPurchase ? "sandbox" : "production",
    storeResponse: googleSub as unknown as Record<string, unknown>,
  });
}

async function processAndroidPurchase(
  sub: typeof subscriber.$inferSelect,
  prod: typeof product.$inferSelect,
  purchaseToken: string,
  productId: string,
  client: GooglePlayClient
): Promise<void> {
  // Get purchase details from Google
  const googlePurchase = await client.getProduct(productId, purchaseToken);

  // Acknowledge if not already acknowledged
  if (googlePurchase.acknowledgementState === 0) {
    await client.acknowledgeProduct(productId, purchaseToken);
  }

  await recordPurchase(sub, prod, {
    platform: "android",
    transactionId: googlePurchase.orderId,
    originalTransactionId: purchaseToken,
    purchaseDate: new Date(parseInt(googlePurchase.purchaseTimeMillis)),
    priceAmountMicros: parseInt(googlePurchase.priceAmountMicros || "0"),
    priceCurrencyCode: googlePurchase.priceCurrencyCode,
    environment: googlePurchase.purchaseType === 0 ? "sandbox" : "production",
    storeResponse: googlePurchase as unknown as Record<string, unknown>,
  });

  // For non-consumables, grant entitlements
  if (prod.type === "non_consumable") {
    const [purchaseRecord] = await db
      .select()
      .from(purchase)
      .where(
        and(
          eq(purchase.platform, "android"),
          eq(purchase.storeTransactionId, googlePurchase.orderId)
        )
      )
      .limit(1);

    if (purchaseRecord) {
      await grantEntitlementsForProduct(sub.id, prod.id, {
        purchaseId: purchaseRecord.id,
      });
    }
  }
}

interface PurchaseData {
  platform: "ios" | "android";
  transactionId: string;
  originalTransactionId?: string;
  purchaseDate: Date;
  expiresDate?: Date;
  priceAmountMicros?: number;
  priceCurrencyCode?: string;
  environment: string;
  storeResponse: Record<string, unknown>;
}

async function recordPurchase(
  sub: typeof subscriber.$inferSelect,
  prod: typeof product.$inferSelect,
  data: PurchaseData
): Promise<void> {
  // Check if purchase already exists
  const [existing] = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.platform, data.platform),
        eq(purchase.storeTransactionId, data.transactionId)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing purchase
    await db
      .update(purchase)
      .set({
        status: "completed",
        expiresDate: data.expiresDate,
        storeResponse: data.storeResponse,
        updatedAt: new Date(),
      })
      .where(eq(purchase.id, existing.id));
  } else {
    // Create new purchase
    await db.insert(purchase).values({
      subscriberId: sub.id,
      productId: prod.id,
      platform: data.platform,
      storeTransactionId: data.transactionId,
      originalTransactionId: data.originalTransactionId,
      status: "completed",
      purchaseDate: data.purchaseDate,
      expiresDate: data.expiresDate,
      priceAmountMicros: data.priceAmountMicros,
      priceCurrencyCode: data.priceCurrencyCode,
      environment: data.environment,
      storeResponse: data.storeResponse,
    });
  }
}

