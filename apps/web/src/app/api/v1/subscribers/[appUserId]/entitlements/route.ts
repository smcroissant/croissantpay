import { NextRequest } from "next/server";
import {
  withApiKey,
  successResponse,
  errorResponse,
} from "@/lib/api/middleware";
import { getSubscriberInfo } from "@/lib/services/subscribers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appUserId: string }> }
) {
  return withApiKey(request, async ({ app }) => {
    const { appUserId } = await params;
    const decodedUserId = decodeURIComponent(appUserId);

    const subscriberInfo = await getSubscriberInfo(app.id, decodedUserId);

    if (!subscriberInfo) {
      return errorResponse("Subscriber not found", 404);
    }

    return successResponse({
      entitlements: subscriberInfo.entitlements,
    });
  });
}

