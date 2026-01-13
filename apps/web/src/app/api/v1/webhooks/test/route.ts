import { NextRequest, NextResponse } from "next/server";
import { requireSecretKey } from "@/lib/api/middleware";
import { z } from "zod";
import {
  recordWebhookEvent,
  generateTestWebhookPayload,
} from "@/lib/services/webhooks";

const testWebhookSchema = z.object({
  platform: z.enum(["ios", "android"]),
  eventType: z.string(),
  productId: z.string().optional(),
  transactionId: z.string().optional(),
});

// POST /api/v1/webhooks/test - Send a test webhook event
export async function POST(request: NextRequest) {
  return requireSecretKey(request, async (context) => {
    const body = await request.json();
    const result = testWebhookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { platform, eventType, productId, transactionId } = result.data;

    // Generate test payload
    const payload = generateTestWebhookPayload(platform, eventType, {
      productId,
      transactionId,
    });

    // Record the test event
    const eventId = await recordWebhookEvent(
      context.app.id,
      platform,
      eventType,
      payload,
      `test-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      eventId,
      message: `Test ${platform} webhook event '${eventType}' created`,
      payload,
    });
  });
}

