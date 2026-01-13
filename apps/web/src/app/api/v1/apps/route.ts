import { NextRequest } from "next/server";
import { z } from "zod";
import {
  requireSecretKey,
  successResponse,
  errorResponse,
  parseBody,
} from "@/lib/api/middleware";
import { createApp, getAppsByOrganization } from "@/lib/services/apps";

const createAppSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  bundleId: z.string().optional(),
  packageName: z.string().optional(),
});

// Create a new app
export async function POST(request: NextRequest) {
  return requireSecretKey(request, async ({ app: currentApp }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = createAppSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    try {
      const newApp = await createApp(result.data);

      return successResponse({
        app: {
          id: newApp.id,
          name: newApp.name,
          bundleId: newApp.bundleId,
          packageName: newApp.packageName,
          publicKey: newApp.publicKey,
          secretKey: newApp.secretKey,
          createdAt: newApp.createdAt,
        },
      }, 201);
    } catch (error) {
      return errorResponse("Failed to create app", 500);
    }
  });
}

