import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey, successResponse, errorResponse } from "@/lib/api/middleware";
import { db } from "@/lib/db";
import { subscriber } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { trackConversion } from "@/lib/services/experiments";

const trackConversionSchema = z.object({
  appUserId: z.string().min(1),
  experimentId: z.string().uuid(),
  conversionType: z.enum([
    "purchase",
    "trial_start",
    "trial_convert",
    "subscription_start",
  ]),
  revenue: z.number().optional(), // in cents
});

// POST /api/v1/experiments/track - Track a conversion
export async function POST(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const body = await request.json();
    const result = trackConversionSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Invalid request", 400);
    }

    const { appUserId, experimentId, conversionType, revenue } = result.data;

    // Get subscriber
    const [sub] = await db
      .select()
      .from(subscriber)
      .where(
        and(
          eq(subscriber.appId, app.id),
          eq(subscriber.appUserId, appUserId)
        )
      )
      .limit(1);

    if (!sub) {
      return errorResponse("Subscriber not found", 404);
    }

    // Track the conversion
    await trackConversion(experimentId, sub.id, conversionType, revenue);

    return successResponse({ success: true });
  });
}

