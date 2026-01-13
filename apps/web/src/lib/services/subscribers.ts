import { db } from "@/lib/db";
import {
  subscriber,
  subscriberEntitlement,
  entitlement,
  subscription,
  purchase,
  product,
  app,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAddSubscriber } from "@/lib/api/plan-limits";

export interface SubscriberInfo {
  id: string;
  appUserId: string;
  originalAppUserId: string | null;
  aliases: string[];
  attributes: Record<string, unknown>;
  firstSeenAt: Date;
  lastSeenAt: Date;
  entitlements: {
    [identifier: string]: {
      isActive: boolean;
      expiresDate: Date | null;
      productIdentifier: string | null;
      purchaseDate: Date | null;
      willRenew: boolean;
      periodType: "normal" | "trial" | "intro";
      latestPurchaseDate: Date | null;
      originalPurchaseDate: Date | null;
      isSandbox: boolean;
    };
  };
  activeSubscriptions: string[];
  nonSubscriptionPurchases: {
    productIdentifier: string;
    purchaseDate: Date;
    transactionId: string;
  }[];
}

export async function getOrCreateSubscriber(
  appId: string,
  appUserId: string
): Promise<typeof subscriber.$inferSelect> {
  // Try to find existing subscriber
  const [existingSubscriber] = await db
    .select()
    .from(subscriber)
    .where(
      and(eq(subscriber.appId, appId), eq(subscriber.appUserId, appUserId))
    )
    .limit(1);

  if (existingSubscriber) {
    // Update last seen
    await db
      .update(subscriber)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriber.id, existingSubscriber.id));

    return existingSubscriber;
  }

  // Get organization ID for the app to check limits
  const [appData] = await db
    .select()
    .from(app)
    .where(eq(app.id, appId))
    .limit(1);

  if (appData) {
    // Check subscriber limits before creating
    const canCreate = await canAddSubscriber(appData.organizationId);
    if (!canCreate.allowed) {
      throw new Error(
        canCreate.error?.message || "Subscriber limit reached. Please upgrade your plan."
      );
    }
  }

  // Create new subscriber
  const [newSubscriber] = await db
    .insert(subscriber)
    .values({
      appId,
      appUserId,
      originalAppUserId: appUserId,
      aliases: [],
      attributes: {},
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    })
    .returning();

  return newSubscriber;
}

export async function getSubscriberInfo(
  appId: string,
  appUserId: string
): Promise<SubscriberInfo | null> {
  const [sub] = await db
    .select()
    .from(subscriber)
    .where(
      and(eq(subscriber.appId, appId), eq(subscriber.appUserId, appUserId))
    )
    .limit(1);

  if (!sub) {
    return null;
  }

  // Get active entitlements
  const entitlementRows = await db
    .select({
      subscriberEntitlement: subscriberEntitlement,
      entitlement: entitlement,
      product: product,
      subscription: subscription,
    })
    .from(subscriberEntitlement)
    .leftJoin(
      entitlement,
      eq(subscriberEntitlement.entitlementId, entitlement.id)
    )
    .leftJoin(product, eq(subscriberEntitlement.productId, product.id))
    .leftJoin(
      subscription,
      eq(subscriberEntitlement.subscriptionId, subscription.id)
    )
    .where(eq(subscriberEntitlement.subscriberId, sub.id));

  // Get non-subscription purchases
  const purchaseRows = await db
    .select({
      purchase: purchase,
      product: product,
    })
    .from(purchase)
    .leftJoin(product, eq(purchase.productId, product.id))
    .where(eq(purchase.subscriberId, sub.id));

  // Build entitlements map
  const entitlements: SubscriberInfo["entitlements"] = {};
  const activeSubscriptions: string[] = [];

  for (const row of entitlementRows) {
    if (!row.entitlement) continue;

    const now = new Date();
    const isActive =
      row.subscriberEntitlement.isActive &&
      (!row.subscriberEntitlement.expiresDate ||
        row.subscriberEntitlement.expiresDate > now);

    // Check if it's from an active subscription
    if (
      row.subscription &&
      row.subscription.status === "active" &&
      row.product
    ) {
      activeSubscriptions.push(row.product.identifier);
    }

    entitlements[row.entitlement.identifier] = {
      isActive,
      expiresDate: row.subscriberEntitlement.expiresDate,
      productIdentifier: row.product?.identifier ?? null,
      purchaseDate: row.subscription?.purchaseDate ?? null,
      willRenew: row.subscription?.autoRenewEnabled ?? false,
      periodType: row.subscription?.isTrialPeriod
        ? "trial"
        : row.subscription?.isInIntroOfferPeriod
        ? "intro"
        : "normal",
      latestPurchaseDate: row.subscription?.purchaseDate ?? null,
      originalPurchaseDate: row.subscription?.originalPurchaseDate ?? null,
      isSandbox: row.subscription?.environment === "sandbox",
    };
  }

  // Build non-subscription purchases
  const nonSubscriptionPurchases: SubscriberInfo["nonSubscriptionPurchases"] =
    purchaseRows
      .filter(
        (row) =>
          row.product &&
          (row.product.type === "consumable" ||
            row.product.type === "non_consumable")
      )
      .map((row) => ({
        productIdentifier: row.product!.identifier,
        purchaseDate: row.purchase.purchaseDate,
        transactionId: row.purchase.storeTransactionId,
      }));

  return {
    id: sub.id,
    appUserId: sub.appUserId,
    originalAppUserId: sub.originalAppUserId,
    aliases: (sub.aliases as string[]) ?? [],
    attributes: (sub.attributes as Record<string, unknown>) ?? {},
    firstSeenAt: sub.firstSeenAt,
    lastSeenAt: sub.lastSeenAt,
    entitlements,
    activeSubscriptions: [...new Set(activeSubscriptions)],
    nonSubscriptionPurchases,
  };
}

export async function updateSubscriberAttributes(
  subscriberId: string,
  attributes: Record<string, unknown>
): Promise<void> {
  const [sub] = await db
    .select()
    .from(subscriber)
    .where(eq(subscriber.id, subscriberId))
    .limit(1);

  if (!sub) {
    throw new Error("Subscriber not found");
  }

  const existingAttributes = (sub.attributes as Record<string, unknown>) ?? {};
  const mergedAttributes = { ...existingAttributes, ...attributes };

  await db
    .update(subscriber)
    .set({
      attributes: mergedAttributes,
      updatedAt: new Date(),
    })
    .where(eq(subscriber.id, subscriberId));
}

export async function aliasSubscriber(
  subscriberId: string,
  newAlias: string
): Promise<void> {
  const [sub] = await db
    .select()
    .from(subscriber)
    .where(eq(subscriber.id, subscriberId))
    .limit(1);

  if (!sub) {
    throw new Error("Subscriber not found");
  }

  const aliases = ((sub.aliases as string[]) ?? []).filter(
    (a) => a !== newAlias
  );
  aliases.push(newAlias);

  await db
    .update(subscriber)
    .set({
      aliases,
      updatedAt: new Date(),
    })
    .where(eq(subscriber.id, subscriberId));
}

