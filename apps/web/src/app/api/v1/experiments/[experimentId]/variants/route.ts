import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { app, organizationMember, experiment, experimentVariant } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/lib/services/experiments";

const createVariantSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isControl: z.boolean().default(false),
  weight: z.number().min(1).max(100).default(50),
  offeringId: z.string().uuid().optional(),
  customProducts: z
    .array(
      z.object({
        productId: z.string().uuid(),
        position: z.number(),
        highlighted: z.boolean().optional(),
        badge: z.string().optional(),
      })
    )
    .optional(),
  paywallConfig: z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      features: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
      theme: z.string().optional(),
    })
    .optional(),
});

// Helper to verify access
async function verifyAccess(experimentId: string, userId: string) {
  const [result] = await db
    .select({ experiment: experiment, app: app })
    .from(experiment)
    .innerJoin(app, eq(experiment.appId, app.id))
    .innerJoin(
      organizationMember,
      eq(app.organizationId, organizationMember.organizationId)
    )
    .where(
      and(
        eq(experiment.id, experimentId),
        eq(organizationMember.userId, userId)
      )
    )
    .limit(1);

  return result;
}

// GET /api/v1/experiments/:experimentId/variants - List variants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  const { experimentId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyAccess(experimentId, session.user.id);
  if (!access) {
    return NextResponse.json(
      { error: "Experiment not found" },
      { status: 404 }
    );
  }

  const variants = await db
    .select()
    .from(experimentVariant)
    .where(eq(experimentVariant.experimentId, experimentId));

  return NextResponse.json({ variants });
}

// POST /api/v1/experiments/:experimentId/variants - Create variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  const { experimentId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await verifyAccess(experimentId, session.user.id);
  if (!access) {
    return NextResponse.json(
      { error: "Experiment not found" },
      { status: 404 }
    );
  }

  // Don't allow adding variants to running experiments
  if (access.experiment.status === "running") {
    return NextResponse.json(
      { error: "Cannot add variants to a running experiment" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const result = createVariantSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const variant = await createVariant({
    experimentId,
    ...result.data,
  });

  return NextResponse.json({ variant }, { status: 201 });
}

