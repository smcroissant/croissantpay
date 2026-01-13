import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireSecretKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import { db } from "@/lib/db";
import { entitlement } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateSubscriber, getSubscriberInfo } from "@/lib/services/subscribers";
import { grantEntitlement, revokeEntitlement } from "@/lib/services/entitlements";

const grantSchema = z.object({
  appUserId: z.string().min(1),
  entitlementIdentifier: z.string().min(1),
  expiresDate: z.string().datetime().optional(),
  reason: z.string().optional(),
});

const revokeSchema = z.object({
  appUserId: z.string().min(1),
  entitlementIdentifier: z.string().min(1),
});

// Grant an entitlement manually
export async function POST(request: NextRequest) {
  return requireSecretKey(request, async ({ app }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = grantSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    const { appUserId, entitlementIdentifier, expiresDate, reason } = result.data;

    // Find the entitlement
    const [ent] = await db
      .select()
      .from(entitlement)
      .where(
        and(
          eq(entitlement.appId, app.id),
          eq(entitlement.identifier, entitlementIdentifier)
        )
      )
      .limit(1);

    if (!ent) {
      return errorResponse(`Entitlement ${entitlementIdentifier} not found`, 404);
    }

    // Get or create subscriber
    const subscriber = await getOrCreateSubscriber(app.id, appUserId);

    // Grant the entitlement
    await grantEntitlement({
      subscriberId: subscriber.id,
      entitlementId: ent.id,
      expiresDate: expiresDate ? new Date(expiresDate) : undefined,
      grantReason: reason,
      grantedBy: "api",
    });

    // Get updated subscriber info
    const subscriberInfo = await getSubscriberInfo(app.id, appUserId);

    return successResponse({
      success: true,
      subscriber: subscriberInfo,
    });
  });
}

// Revoke an entitlement manually
export async function DELETE(request: NextRequest) {
  return requireSecretKey(request, async ({ app }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = revokeSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    const { appUserId, entitlementIdentifier } = result.data;

    // Find the entitlement
    const [ent] = await db
      .select()
      .from(entitlement)
      .where(
        and(
          eq(entitlement.appId, app.id),
          eq(entitlement.identifier, entitlementIdentifier)
        )
      )
      .limit(1);

    if (!ent) {
      return errorResponse(`Entitlement ${entitlementIdentifier} not found`, 404);
    }

    // Get subscriber
    const subscriber = await getOrCreateSubscriber(app.id, appUserId);

    // Revoke the entitlement
    await revokeEntitlement(subscriber.id, ent.id);

    // Get updated subscriber info
    const subscriberInfo = await getSubscriberInfo(app.id, appUserId);

    return successResponse({
      success: true,
      subscriber: subscriberInfo,
    });
  });
}

