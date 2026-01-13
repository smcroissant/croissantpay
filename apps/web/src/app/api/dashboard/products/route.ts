import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/services/organizations";
import { createProduct, getProductsByApp } from "@/lib/services/products";
import { getAppsByOrganization, userHasAppAccess } from "@/lib/services/apps";
import { db } from "@/lib/db";
import { product, app } from "@/lib/db/schema";
import { eq, inArray, desc } from "drizzle-orm";

const createProductSchema = z.object({
  appId: z.string().uuid(),
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
});

// GET /api/dashboard/products - List all products for the user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await getUserOrganizations(session.user.id);
    if (organizations.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const organizationId = organizations[0].id;
    const apps = await getAppsByOrganization(organizationId);
    
    if (apps.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const appIds = apps.map((a) => a.id);
    
    const products = await db
      .select()
      .from(product)
      .where(inArray(product.appId, appIds))
      .orderBy(desc(product.createdAt));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify user has access to the app
    const hasAccess = await userHasAppAccess(session.user.id, result.data.appId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    const newProduct = await createProduct(result.data);

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

