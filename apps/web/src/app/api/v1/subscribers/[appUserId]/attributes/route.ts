import { NextRequest } from "next/server";
import {
  withApiKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import { updateAttributesSchema } from "@/lib/api/validation";
import {
  getOrCreateSubscriber,
  updateSubscriberAttributes,
} from "@/lib/services/subscribers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appUserId: string }> }
) {
  return withApiKey(request, async ({ app }) => {
    const { appUserId } = await params;
    const decodedUserId = decodeURIComponent(appUserId);

    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = updateAttributesSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    // Get or create subscriber
    const subscriber = await getOrCreateSubscriber(app.id, decodedUserId);

    // Update attributes
    await updateSubscriberAttributes(subscriber.id, result.data.attributes);

    return successResponse({ success: true });
  });
}

