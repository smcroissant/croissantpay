import { db } from "@/lib/db";
import {
  promoCode,
  promoCodeRedemption,
  subscriber,
  subscriberEntitlement,
  entitlement,
} from "@/lib/db/schema";
import { eq, and, sql, gte, lte, isNull, or, inArray } from "drizzle-orm";
import crypto from "crypto";

// Types
export type PromoCodeType =
  | "percentage_discount"
  | "fixed_discount"
  | "free_trial_extension"
  | "free_subscription";

export interface CreatePromoCodeInput {
  appId: string;
  code?: string; // Auto-generate if not provided
  name: string;
  description?: string;
  type: PromoCodeType;
  discountPercent?: number;
  discountAmount?: number;
  freeTrialDays?: number;
  freePeriod?: string;
  productIds?: string[];
  entitlementIds?: string[];
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface RedeemPromoCodeResult {
  success: boolean;
  error?: string;
  redemption?: typeof promoCodeRedemption.$inferSelect;
  grantedEntitlements?: string[];
  discountApplied?: number;
  trialDaysGranted?: number;
}

// Generate a random promo code
export function generatePromoCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// Create a new promo code
export async function createPromoCode(
  input: CreatePromoCodeInput
): Promise<typeof promoCode.$inferSelect> {
  const code = input.code || generatePromoCode();

  const [newPromoCode] = await db
    .insert(promoCode)
    .values({
      appId: input.appId,
      code: code.toUpperCase(),
      name: input.name,
      description: input.description,
      type: input.type,
      discountPercent: input.discountPercent,
      discountAmount: input.discountAmount,
      freeTrialDays: input.freeTrialDays,
      freePeriod: input.freePeriod,
      productIds: input.productIds,
      entitlementIds: input.entitlementIds,
      maxRedemptions: input.maxRedemptions,
      maxRedemptionsPerUser: input.maxRedemptionsPerUser ?? 1,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      metadata: input.metadata,
    })
    .returning();

  return newPromoCode;
}

// Get promo code by ID
export async function getPromoCode(
  promoCodeId: string
): Promise<typeof promoCode.$inferSelect | null> {
  const [code] = await db
    .select()
    .from(promoCode)
    .where(eq(promoCode.id, promoCodeId))
    .limit(1);

  return code || null;
}

// Get promo code by code string
export async function getPromoCodeByCode(
  appId: string,
  code: string
): Promise<typeof promoCode.$inferSelect | null> {
  const [result] = await db
    .select()
    .from(promoCode)
    .where(
      and(
        eq(promoCode.appId, appId),
        eq(promoCode.code, code.toUpperCase())
      )
    )
    .limit(1);

  return result || null;
}

// Get all promo codes for an app
export async function getPromoCodesByApp(
  appId: string
): Promise<Array<typeof promoCode.$inferSelect & { redemptionCount: number }>> {
  const codes = await db
    .select()
    .from(promoCode)
    .where(eq(promoCode.appId, appId))
    .orderBy(promoCode.createdAt);

  // Get redemption counts
  const codeIds = codes.map((c) => c.id);
  const redemptionCounts = codeIds.length > 0
    ? await db
        .select({
          promoCodeId: promoCodeRedemption.promoCodeId,
          count: sql<number>`count(*)`,
        })
        .from(promoCodeRedemption)
        .where(inArray(promoCodeRedemption.promoCodeId, codeIds))
        .groupBy(promoCodeRedemption.promoCodeId)
    : [];

  const countMap = new Map(
    redemptionCounts.map((r) => [r.promoCodeId, Number(r.count)])
  );

  return codes.map((code) => ({
    ...code,
    redemptionCount: countMap.get(code.id) || 0,
  }));
}

// Update promo code
export async function updatePromoCode(
  promoCodeId: string,
  updates: Partial<CreatePromoCodeInput> & { isActive?: boolean }
): Promise<typeof promoCode.$inferSelect> {
  const [updated] = await db
    .update(promoCode)
    .set({
      ...updates,
      code: updates.code?.toUpperCase(),
      updatedAt: new Date(),
    })
    .where(eq(promoCode.id, promoCodeId))
    .returning();

  return updated;
}

// Delete promo code
export async function deletePromoCode(promoCodeId: string): Promise<void> {
  await db.delete(promoCode).where(eq(promoCode.id, promoCodeId));
}

// Validate if a promo code can be redeemed
export async function validatePromoCode(
  appId: string,
  code: string,
  subscriberId: string
): Promise<{ valid: boolean; error?: string; promoCode?: typeof promoCode.$inferSelect }> {
  // Find the promo code
  const promo = await getPromoCodeByCode(appId, code);

  if (!promo) {
    return { valid: false, error: "Promo code not found" };
  }

  // Check if active
  if (!promo.isActive) {
    return { valid: false, error: "Promo code is no longer active" };
  }

  // Check date validity
  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) {
    return { valid: false, error: "Promo code is not yet valid" };
  }
  if (promo.expiresAt && promo.expiresAt < now) {
    return { valid: false, error: "Promo code has expired" };
  }

  // Check max redemptions
  if (promo.maxRedemptions && promo.currentRedemptions >= promo.maxRedemptions) {
    return { valid: false, error: "Promo code has reached its redemption limit" };
  }

  // Check per-user limit
  const userRedemptions = await db
    .select({ count: sql<number>`count(*)` })
    .from(promoCodeRedemption)
    .where(
      and(
        eq(promoCodeRedemption.promoCodeId, promo.id),
        eq(promoCodeRedemption.subscriberId, subscriberId)
      )
    );

  const userCount = Number(userRedemptions[0]?.count || 0);
  if (promo.maxRedemptionsPerUser && userCount >= promo.maxRedemptionsPerUser) {
    return { valid: false, error: "You have already redeemed this promo code" };
  }

  return { valid: true, promoCode: promo };
}

// Redeem a promo code
export async function redeemPromoCode(
  appId: string,
  code: string,
  subscriberId: string
): Promise<RedeemPromoCodeResult> {
  // Validate first
  const validation = await validatePromoCode(appId, code, subscriberId);
  if (!validation.valid || !validation.promoCode) {
    return { success: false, error: validation.error };
  }

  const promo = validation.promoCode;

  try {
    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Increment redemption count
      await tx
        .update(promoCode)
        .set({
          currentRedemptions: sql`${promoCode.currentRedemptions} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(promoCode.id, promo.id));

      // Calculate benefits
      let grantedEntitlements: string[] = [];
      let discountApplied: number | undefined;
      let trialDaysGranted: number | undefined;
      let expiresAt: Date | undefined;

      // Handle different promo code types
      switch (promo.type) {
        case "percentage_discount":
          discountApplied = promo.discountPercent ?? undefined;
          break;

        case "fixed_discount":
          discountApplied = promo.discountAmount ?? 0;
          break;

        case "free_trial_extension":
          trialDaysGranted = promo.freeTrialDays ?? 0;
          break;

        case "free_subscription":
          // Grant entitlements for the free period
          if (promo.entitlementIds && promo.entitlementIds.length > 0) {
            grantedEntitlements = promo.entitlementIds;

            // Calculate expiration based on free period
            if (promo.freePeriod) {
              expiresAt = calculateExpirationFromPeriod(promo.freePeriod);
            }

            // Grant entitlements
            for (const entitlementId of promo.entitlementIds) {
              // Check if entitlement exists
              const [ent] = await tx
                .select()
                .from(entitlement)
                .where(eq(entitlement.id, entitlementId))
                .limit(1);

              if (ent) {
                // Check if subscriber already has this entitlement
                const [existing] = await tx
                  .select()
                  .from(subscriberEntitlement)
                  .where(
                    and(
                      eq(subscriberEntitlement.subscriberId, subscriberId),
                      eq(subscriberEntitlement.entitlementId, entitlementId)
                    )
                  )
                  .limit(1);

                if (existing) {
                  // Update existing entitlement to extend expiration
                  await tx
                    .update(subscriberEntitlement)
                    .set({
                      isActive: true,
                      expiresDate: expiresAt,
                      grantReason: `Promo code: ${promo.code}`,
                      updatedAt: new Date(),
                    })
                    .where(eq(subscriberEntitlement.id, existing.id));
                } else {
                  // Create new entitlement
                  await tx.insert(subscriberEntitlement).values({
                    subscriberId,
                    entitlementId,
                    isActive: true,
                    expiresDate: expiresAt,
                    grantReason: `Promo code: ${promo.code}`,
                  });
                }
              }
            }
          }
          break;
      }

      // Create redemption record
      const [redemption] = await tx
        .insert(promoCodeRedemption)
        .values({
          promoCodeId: promo.id,
          subscriberId,
          appliedDiscount: discountApplied,
          grantedEntitlements,
          grantedTrialDays: trialDaysGranted,
          expiresAt,
          status: "applied",
        })
        .returning();

      return {
        redemption,
        grantedEntitlements,
        discountApplied,
        trialDaysGranted,
      };
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error("Error redeeming promo code:", error);
    return {
      success: false,
      error: "Failed to redeem promo code",
    };
  }
}

// Get redemptions for a promo code
export async function getPromoCodeRedemptions(
  promoCodeId: string
): Promise<Array<typeof promoCodeRedemption.$inferSelect & { subscriber: { appUserId: string } }>> {
  const redemptions = await db
    .select({
      redemption: promoCodeRedemption,
      subscriber: {
        appUserId: subscriber.appUserId,
      },
    })
    .from(promoCodeRedemption)
    .innerJoin(subscriber, eq(promoCodeRedemption.subscriberId, subscriber.id))
    .where(eq(promoCodeRedemption.promoCodeId, promoCodeId))
    .orderBy(promoCodeRedemption.redeemedAt);

  return redemptions.map((r) => ({
    ...r.redemption,
    subscriber: r.subscriber,
  }));
}

// Get subscriber's redemptions
export async function getSubscriberRedemptions(
  subscriberId: string
): Promise<Array<typeof promoCodeRedemption.$inferSelect & { code: string }>> {
  const redemptions = await db
    .select({
      redemption: promoCodeRedemption,
      code: promoCode.code,
    })
    .from(promoCodeRedemption)
    .innerJoin(promoCode, eq(promoCodeRedemption.promoCodeId, promoCode.id))
    .where(eq(promoCodeRedemption.subscriberId, subscriberId))
    .orderBy(promoCodeRedemption.redeemedAt);

  return redemptions.map((r) => ({
    ...r.redemption,
    code: r.code,
  }));
}

// Revoke a redemption
export async function revokeRedemption(redemptionId: string): Promise<void> {
  const [redemption] = await db
    .select()
    .from(promoCodeRedemption)
    .where(eq(promoCodeRedemption.id, redemptionId))
    .limit(1);

  if (!redemption) return;

  // Update redemption status
  await db
    .update(promoCodeRedemption)
    .set({ status: "revoked" })
    .where(eq(promoCodeRedemption.id, redemptionId));

  // Deactivate granted entitlements
  if (redemption.grantedEntitlements && redemption.grantedEntitlements.length > 0) {
    for (const entitlementId of redemption.grantedEntitlements) {
      await db
        .update(subscriberEntitlement)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriberEntitlement.subscriberId, redemption.subscriberId),
            eq(subscriberEntitlement.entitlementId, entitlementId)
          )
        );
    }
  }

  // Decrement promo code counter
  await db
    .update(promoCode)
    .set({
      currentRedemptions: sql`greatest(${promoCode.currentRedemptions} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(promoCode.id, redemption.promoCodeId));
}

// Bulk create promo codes
export async function bulkCreatePromoCodes(
  input: CreatePromoCodeInput,
  count: number
): Promise<Array<typeof promoCode.$inferSelect>> {
  const codes: Array<typeof promoCode.$inferSelect> = [];

  for (let i = 0; i < count; i++) {
    const code = await createPromoCode({
      ...input,
      code: generatePromoCode(),
      name: `${input.name} #${i + 1}`,
    });
    codes.push(code);
  }

  return codes;
}

// Helper: Calculate expiration from ISO 8601 duration
function calculateExpirationFromPeriod(period: string): Date {
  const now = new Date();
  const match = period.match(/P(\d+)([DWMY])/);

  if (!match) return now;

  const [, count, unit] = match;
  const num = parseInt(count, 10);

  switch (unit) {
    case "D":
      now.setDate(now.getDate() + num);
      break;
    case "W":
      now.setDate(now.getDate() + num * 7);
      break;
    case "M":
      now.setMonth(now.getMonth() + num);
      break;
    case "Y":
      now.setFullYear(now.getFullYear() + num);
      break;
  }

  return now;
}

