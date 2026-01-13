import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireSecretKey,
  withApiKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import {
  createEntitlement,
  getEntitlementsByApp,
} from "@/lib/services/products";

const createEntitlementSchema = z.object({
  identifier: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
});

// Get entitlements for current app
export async function GET(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const entitlements = await getEntitlementsByApp(app.id);

    return successResponse({
      entitlements: entitlements.map((e) => ({
        id: e.id,
        identifier: e.identifier,
        displayName: e.displayName,
        description: e.description,
      })),
    });
  });
}

// Create a new entitlement
export async function POST(request: NextRequest) {
  return requireSecretKey(request, async ({ app }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = createEntitlementSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    try {
      const newEntitlement = await createEntitlement({
        appId: app.id,
        ...result.data,
      });

      return successResponse({
        entitlement: {
          id: newEntitlement.id,
          identifier: newEntitlement.identifier,
          displayName: newEntitlement.displayName,
          description: newEntitlement.description,
        },
      }, 201);
    } catch (error) {
      return errorResponse("Failed to create entitlement", 500);
    }
  });
}

