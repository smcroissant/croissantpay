import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { app, organizationMember, experiment } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentResults,
  concludeExperiment,
} from "@/lib/services/experiments";

const updateExperimentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  hypothesis: z.string().max(500).optional(),
  status: z
    .enum(["draft", "running", "paused", "completed", "archived"])
    .optional(),
  trafficAllocation: z.number().min(1).max(100).optional(),
  targetAudience: z
    .object({
      platforms: z.array(z.enum(["ios", "android"])).optional(),
      countries: z.array(z.string()).optional(),
      appVersions: z.array(z.string()).optional(),
    })
    .optional(),
  winningVariantId: z.string().uuid().optional(),
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

// GET /api/v1/experiments/:experimentId - Get experiment details
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

  // Check if results are requested
  const { searchParams } = new URL(request.url);
  const includeResults = searchParams.get("results") === "true";

  if (includeResults) {
    const results = await getExperimentResults(experimentId);
    return NextResponse.json(results);
  }

  const expWithVariants = await getExperiment(experimentId);
  return NextResponse.json(expWithVariants);
}

// PATCH /api/v1/experiments/:experimentId - Update experiment
export async function PATCH(
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

  const body = await request.json();
  const result = updateExperimentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Handle concluding experiment with winner
  if (data.status === "completed" && data.winningVariantId) {
    const updated = await concludeExperiment(
      experimentId,
      data.winningVariantId
    );
    return NextResponse.json({ experiment: updated });
  }

  const updated = await updateExperiment(experimentId, data);
  return NextResponse.json({ experiment: updated });
}

// DELETE /api/v1/experiments/:experimentId - Delete experiment
export async function DELETE(
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

  // Don't allow deleting running experiments
  if (access.experiment.status === "running") {
    return NextResponse.json(
      { error: "Cannot delete a running experiment. Pause or complete it first." },
      { status: 400 }
    );
  }

  await deleteExperiment(experimentId);
  return NextResponse.json({ success: true });
}

