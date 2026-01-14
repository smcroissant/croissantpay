import { NextRequest } from "next/server";
import {
  withApiKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import { getOrCreateSubscriber, getSubscriberInfo, updateSubscriberAttributes } from "@/lib/services/subscribers";

interface CreateSubscriberBody {
  appUserId: string;
  attributes?: Record<string, unknown>;
}

/**
 * POST /api/v1/subscribers
 * Create a new subscriber or return existing one
 */
export async function POST(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const body = await parseBody<CreateSubscriberBody>(request);

    if (!body?.appUserId) {
      return errorResponse("appUserId is required", 400);
    }

    try {
      // Get or create the subscriber
      const sub = await getOrCreateSubscriber(app.id, body.appUserId);

      // If attributes were provided, update them
      if (body.attributes && Object.keys(body.attributes).length > 0) {
        await updateSubscriberAttributes(sub.id, body.attributes);
      }

      // Return full subscriber info
      const subscriberInfo = await getSubscriberInfo(app.id, body.appUserId);

      return successResponse({
        subscriber: subscriberInfo,
      });
    } catch (error) {
      // Handle subscriber limit errors
      if (error instanceof Error && error.message.includes("limit")) {
        return errorResponse(error.message, 402);
      }
      throw error;
    }
  });
}
