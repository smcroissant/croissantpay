import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { app, organizationMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createPromoCode,
  getPromoCodesByApp,
  bulkCreatePromoCodes,
} from "@/lib/services/promo-codes";

const createPromoCodeSchema = z.object({
  appId: z.string().uuid(),
  code: z.string().min(3).max(32).optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    "percentage_discount",
    "fixed_discount",
    "free_trial_extension",
    "free_subscription",
  ]),
  discountPercent: z.number().min(1).max(100).optional(),
  discountAmount: z.number().min(1).optional(),
  freeTrialDays: z.number().min(1).optional(),
  freePeriod: z.string().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  entitlementIds: z.array(z.string().uuid()).optional(),
  maxRedemptions: z.number().min(1).optional(),
  maxRedemptionsPerUser: z.number().min(1).default(1),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  // Bulk creation
  bulkCount: z.number().min(1).max(1000).optional(),
});

// GET /api/v1/promo-codes?appId=xxx - List promo codes for an app
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");

  if (!appId) {
    return NextResponse.json(
      { error: "appId query parameter is required" },
      { status: 400 }
    );
  }

  // Verify user has access to this app
  const [appData] = await db
    .select()
    .from(app)
    .innerJoin(
      organizationMember,
      eq(app.organizationId, organizationMember.organizationId)
    )
    .where(
      and(eq(app.id, appId), eq(organizationMember.userId, session.user.id))
    )
    .limit(1);

  if (!appData) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const promoCodes = await getPromoCodesByApp(appId);

  return NextResponse.json({ promoCodes });
}

// POST /api/v1/promo-codes - Create a promo code
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createPromoCodeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Verify user has access to this app
  const [appData] = await db
    .select()
    .from(app)
    .innerJoin(
      organizationMember,
      eq(app.organizationId, organizationMember.organizationId)
    )
    .where(
      and(eq(app.id, data.appId), eq(organizationMember.userId, session.user.id))
    )
    .limit(1);

  if (!appData) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  // Validate type-specific fields
  if (data.type === "percentage_discount" && !data.discountPercent) {
    return NextResponse.json(
      { error: "discountPercent is required for percentage_discount type" },
      { status: 400 }
    );
  }
  if (data.type === "fixed_discount" && !data.discountAmount) {
    return NextResponse.json(
      { error: "discountAmount is required for fixed_discount type" },
      { status: 400 }
    );
  }
  if (data.type === "free_trial_extension" && !data.freeTrialDays) {
    return NextResponse.json(
      { error: "freeTrialDays is required for free_trial_extension type" },
      { status: 400 }
    );
  }
  if (data.type === "free_subscription" && !data.freePeriod) {
    return NextResponse.json(
      { error: "freePeriod is required for free_subscription type" },
      { status: 400 }
    );
  }

  try {
    // Bulk creation
    if (data.bulkCount && data.bulkCount > 1) {
      const promoCodes = await bulkCreatePromoCodes(
        {
          ...data,
          startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        },
        data.bulkCount
      );

      return NextResponse.json({ promoCodes }, { status: 201 });
    }

    // Single creation
    const promoCode = await createPromoCode({
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return NextResponse.json({ promoCode }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "A promo code with this code already exists" },
        { status: 409 }
      );
    }
    throw error;
  }
}

