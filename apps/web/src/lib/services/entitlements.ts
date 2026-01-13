import { db } from "@/lib/db";
import {
  subscriberEntitlement,
  entitlement,
  productEntitlement,
  product,
  subscription,
  purchase,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface EntitlementGrant {
  subscriberId: string;
  entitlementId: string;
  productId?: string;
  subscriptionId?: string;
  purchaseId?: string;
  expiresDate?: Date;
  grantedBy?: string;
  grantReason?: string;
}

// Grant entitlement to subscriber
export async function grantEntitlement(grant: EntitlementGrant): Promise<void> {
  // Check if entitlement already exists
  const [existing] = await db
    .select()
    .from(subscriberEntitlement)
    .where(
      and(
        eq(subscriberEntitlement.subscriberId, grant.subscriberId),
        eq(subscriberEntitlement.entitlementId, grant.entitlementId)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing entitlement
    await db
      .update(subscriberEntitlement)
      .set({
        isActive: true,
        productId: grant.productId ?? existing.productId,
        subscriptionId: grant.subscriptionId ?? existing.subscriptionId,
        purchaseId: grant.purchaseId ?? existing.purchaseId,
        expiresDate: grant.expiresDate ?? existing.expiresDate,
        grantedBy: grant.grantedBy ?? existing.grantedBy,
        grantReason: grant.grantReason ?? existing.grantReason,
        updatedAt: new Date(),
      })
      .where(eq(subscriberEntitlement.id, existing.id));
  } else {
    // Create new entitlement
    await db.insert(subscriberEntitlement).values({
      subscriberId: grant.subscriberId,
      entitlementId: grant.entitlementId,
      productId: grant.productId,
      subscriptionId: grant.subscriptionId,
      purchaseId: grant.purchaseId,
      isActive: true,
      expiresDate: grant.expiresDate,
      grantedBy: grant.grantedBy,
      grantReason: grant.grantReason,
    });
  }
}

// Revoke entitlement from subscriber
export async function revokeEntitlement(
  subscriberId: string,
  entitlementId: string
): Promise<void> {
  await db
    .update(subscriberEntitlement)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriberEntitlement.subscriberId, subscriberId),
        eq(subscriberEntitlement.entitlementId, entitlementId)
      )
    );
}

// Grant all entitlements linked to a product
export async function grantEntitlementsForProduct(
  subscriberId: string,
  productId: string,
  options: {
    subscriptionId?: string;
    purchaseId?: string;
    expiresDate?: Date;
  } = {}
): Promise<void> {
  // Get all entitlements linked to this product
  const linkedEntitlements = await db
    .select({ entitlementId: productEntitlement.entitlementId })
    .from(productEntitlement)
    .where(eq(productEntitlement.productId, productId));

  // Grant each entitlement
  for (const { entitlementId } of linkedEntitlements) {
    await grantEntitlement({
      subscriberId,
      entitlementId,
      productId,
      subscriptionId: options.subscriptionId,
      purchaseId: options.purchaseId,
      expiresDate: options.expiresDate,
    });
  }
}

// Revoke all entitlements linked to a product
export async function revokeEntitlementsForProduct(
  subscriberId: string,
  productId: string
): Promise<void> {
  // Get all entitlements linked to this product
  const linkedEntitlements = await db
    .select({ entitlementId: productEntitlement.entitlementId })
    .from(productEntitlement)
    .where(eq(productEntitlement.productId, productId));

  const entitlementIds = linkedEntitlements.map((e) => e.entitlementId);

  if (entitlementIds.length === 0) return;

  // Revoke each entitlement that was granted from this product
  await db
    .update(subscriberEntitlement)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriberEntitlement.subscriberId, subscriberId),
        eq(subscriberEntitlement.productId, productId),
        inArray(subscriberEntitlement.entitlementId, entitlementIds)
      )
    );
}

// Refresh entitlements based on active subscriptions and purchases
export async function refreshEntitlements(subscriberId: string): Promise<void> {
  // Get all active subscriptions
  const activeSubscriptions = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.subscriberId, subscriberId),
        eq(subscription.status, "active")
      )
    );

  // Get all completed purchases for non-consumables
  const purchases = await db
    .select({ purchase: purchase, product: product })
    .from(purchase)
    .leftJoin(product, eq(purchase.productId, product.id))
    .where(
      and(
        eq(purchase.subscriberId, subscriberId),
        eq(purchase.status, "completed")
      )
    );

  // First, deactivate all entitlements
  await db
    .update(subscriberEntitlement)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(subscriberEntitlement.subscriberId, subscriberId));

  // Grant entitlements for active subscriptions
  for (const sub of activeSubscriptions) {
    await grantEntitlementsForProduct(subscriberId, sub.productId, {
      subscriptionId: sub.id,
      expiresDate: sub.expiresDate ?? undefined,
    });
  }

  // Grant entitlements for non-consumable purchases
  for (const { purchase: p, product: prod } of purchases) {
    if (prod && prod.type === "non_consumable") {
      await grantEntitlementsForProduct(subscriberId, p.productId, {
        purchaseId: p.id,
      });
    }
  }
}

// Get active entitlements for subscriber
export async function getActiveEntitlements(
  subscriberId: string
): Promise<
  Array<{
    identifier: string;
    displayName: string;
    expiresDate: Date | null;
    productIdentifier: string | null;
  }>
> {
  const now = new Date();

  const rows = await db
    .select({
      entitlement: entitlement,
      subscriberEntitlement: subscriberEntitlement,
      product: product,
    })
    .from(subscriberEntitlement)
    .leftJoin(
      entitlement,
      eq(subscriberEntitlement.entitlementId, entitlement.id)
    )
    .leftJoin(product, eq(subscriberEntitlement.productId, product.id))
    .where(
      and(
        eq(subscriberEntitlement.subscriberId, subscriberId),
        eq(subscriberEntitlement.isActive, true)
      )
    );

  return rows
    .filter((row) => {
      if (!row.entitlement) return false;
      if (!row.subscriberEntitlement.expiresDate) return true;
      return row.subscriberEntitlement.expiresDate > now;
    })
    .map((row) => ({
      identifier: row.entitlement!.identifier,
      displayName: row.entitlement!.displayName,
      expiresDate: row.subscriberEntitlement.expiresDate,
      productIdentifier: row.product?.identifier ?? null,
    }));
}

