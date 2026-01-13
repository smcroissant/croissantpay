import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { app, organizationMember, promoCode } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeRedemptions,
} from "@/lib/services/promo-codes";

const updatePromoCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().min(1).optional(),
  maxRedemptionsPerUser: z.number().min(1).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

// Helper to verify access
async function verifyAccess(promoCodeId: string, userId: string) {
  const [result] = await db
    .select({ promoCode: promoCode, app: app })
    .from(promoCode)
    .innerJoin(app, eq(promoCode.appId, app.id))
    .innerJoin(
      organizationMember,
      eq(app.organizationId, organizationMember.organizationId)
    )
    .where(
      and(
        eq(promoCode.id, promoCodeId),
        eq(organizationMember.userId, userId)
      )
    )
    .limit(1);

  return result;
}

// GET /api/v1/promo-codes/:promoCodeId - Get promo code details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promoCodeId: string }> }
) {
  const { promoCodeId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyAccess(promoCodeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  // Get redemptions
  const redemptions = await getPromoCodeRedemptions(promoCodeId);

  return NextResponse.json({
    promoCode: access.promoCode,
    redemptions,
  });
}

// PATCH /api/v1/promo-codes/:promoCodeId - Update promo code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ promoCodeId: string }> }
) {
  const { promoCodeId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyAccess(promoCodeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  const body = await request.json();
  const result = updatePromoCodeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await updatePromoCode(promoCodeId, {
    ...result.data,
    expiresAt: result.data.expiresAt
      ? new Date(result.data.expiresAt)
      : result.data.expiresAt === null
      ? undefined
      : undefined,
  });

  return NextResponse.json({ promoCode: updated });
}

// DELETE /api/v1/promo-codes/:promoCodeId - Delete promo code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promoCodeId: string }> }
) {
  const { promoCodeId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyAccess(promoCodeId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  await deletePromoCode(promoCodeId);

  return NextResponse.json({ success: true });
}

