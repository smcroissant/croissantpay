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
  createProduct,
  getProductsByApp,
  linkProductToEntitlements,
} from "@/lib/services/products";

const createProductSchema = z.object({
  identifier: z.string().min(1),
  storeProductId: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  type: z.enum([
    "consumable",
    "non_consumable",
    "auto_renewable_subscription",
    "non_renewing_subscription",
  ]),
  displayName: z.string().min(1),
  description: z.string().optional(),
  subscriptionGroupId: z.string().optional(),
  trialDuration: z.string().optional(),
  subscriptionPeriod: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  entitlementIds: z.array(z.string().uuid()).optional(),
});

// Get products for current app
export async function GET(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    const products = await getProductsByApp(app.id);

    return successResponse({
      products: products.map((p) => ({
        id: p.id,
        identifier: p.identifier,
        storeProductId: p.storeProductId,
        platform: p.platform,
        type: p.type,
        displayName: p.displayName,
        description: p.description,
        subscriptionPeriod: p.subscriptionPeriod,
        trialDuration: p.trialDuration,
        isActive: p.isActive,
      })),
    });
  });
}

// Create a new product
export async function POST(request: NextRequest) {
  return requireSecretKey(request, async ({ app }) => {
    const body = await parseBody<unknown>(request);

    if (!body) {
      return errorResponse("Invalid JSON body", 400);
    }

    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return errorResponse("Validation error", 400, {
        details: result.error.flatten(),
      });
    }

    try {
      const { entitlementIds, ...productData } = result.data;

      const newProduct = await createProduct({
        appId: app.id,
        ...productData,
      });

      // Link entitlements if provided
      if (entitlementIds && entitlementIds.length > 0) {
        await linkProductToEntitlements(newProduct.id, entitlementIds);
      }

      return successResponse({
        product: {
          id: newProduct.id,
          identifier: newProduct.identifier,
          storeProductId: newProduct.storeProductId,
          platform: newProduct.platform,
          type: newProduct.type,
          displayName: newProduct.displayName,
          description: newProduct.description,
        },
      }, 201);
    } catch (error) {
      return errorResponse("Failed to create product", 500);
    }
  });
}

