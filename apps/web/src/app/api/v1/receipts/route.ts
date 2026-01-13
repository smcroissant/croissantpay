import { NextRequest } from "next/server";
import {
  withApiKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import { validateReceiptSchema } from "@/lib/api/validation";
import { validateiOSReceipt, validateAndroidReceipt } from "@/lib/services/receipts";

export async function POST(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = validateReceiptSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    const { appUserId, platform, receiptData, productId, transactionId, subscriptionId } =
      result.data;

    if (platform === "ios") {
      // For iOS, receiptData should be transaction ID for StoreKit 2
      const txId = transactionId || receiptData;
      const validationResult = await validateiOSReceipt(app, appUserId, txId);

      if (!validationResult.success) {
        return errorResponse(
          validationResult.error || "Receipt validation failed",
          400
        );
      }

      return successResponse({
        subscriber: validationResult.subscriberInfo,
      });
    }

    if (platform === "android") {
      if (!productId) {
        return errorResponse("productId is required for Android", 400);
      }

      // Determine if it's a subscription
      const isSubscription =
        subscriptionId !== undefined ||
        (productId && productId.includes("subscription"));

      const validationResult = await validateAndroidReceipt(
        app,
        appUserId,
        receiptData, // purchase token
        productId,
        isSubscription
      );

      if (!validationResult.success) {
        return errorResponse(
          validationResult.error || "Receipt validation failed",
          400
        );
      }

      return successResponse({
        subscriber: validationResult.subscriberInfo,
      });
    }

    return errorResponse("Invalid platform", 400);
  });
}

