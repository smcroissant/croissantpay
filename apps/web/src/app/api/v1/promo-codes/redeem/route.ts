import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey, successResponse, errorResponse } from "@/lib/api/middleware";
import { validatePromoCode, redeemPromoCode } from "@/lib/services/promo-codes";
import { getOrCreateSubscriber } from "@/lib/services/subscribers";

const validateSchema = z.object({
  code: z.string().min(1),
  appUserId: z.string().min(1),
});

const redeemSchema = z.object({
  code: z.string().min(1),
  appUserId: z.string().min(1),
});

// POST /api/v1/promo-codes/redeem?validate=true - Validate a promo code
// POST /api/v1/promo-codes/redeem - Redeem a promo code
export async function POST(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const { searchParams } = new URL(request.url);
    const validateOnly = searchParams.get("validate") === "true";

    const body = await request.json();

    if (validateOnly) {
      // Validation only
      const result = validateSchema.safeParse(body);
      if (!result.success) {
        return errorResponse("Invalid request", 400);
      }

      const { code, appUserId } = result.data;

      // Get or create subscriber
      const subscriber = await getOrCreateSubscriber(app.id, appUserId);

      const validation = await validatePromoCode(app.id, code, subscriber.id);

      if (!validation.valid) {
        return errorResponse(validation.error || "Invalid promo code", 400);
      }

      // Return promo code info without redeeming
      return successResponse({
        valid: true,
        promoCode: {
          code: validation.promoCode!.code,
          name: validation.promoCode!.name,
          type: validation.promoCode!.type,
          discountPercent: validation.promoCode!.discountPercent,
          discountAmount: validation.promoCode!.discountAmount,
          freeTrialDays: validation.promoCode!.freeTrialDays,
          freePeriod: validation.promoCode!.freePeriod,
        },
      });
    }

    // Redemption
    const result = redeemSchema.safeParse(body);
    if (!result.success) {
      return errorResponse("Invalid request", 400);
    }

    const { code, appUserId } = result.data;

    // Get or create subscriber
    const subscriber = await getOrCreateSubscriber(app.id, appUserId);

    const redemption = await redeemPromoCode(app.id, code, subscriber.id);

    if (!redemption.success) {
      return errorResponse(redemption.error || "Failed to redeem promo code", 400);
    }

    return successResponse({
      success: true,
      redemption: {
        id: redemption.redemption!.id,
        redeemedAt: redemption.redemption!.redeemedAt,
        grantedEntitlements: redemption.grantedEntitlements,
        discountApplied: redemption.discountApplied,
        trialDaysGranted: redemption.trialDaysGranted,
        expiresAt: redemption.redemption!.expiresAt,
      },
    });
  });
}

