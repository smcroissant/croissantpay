import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { app, organizationMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  createExperiment,
  getExperimentsByApp,
  createVariant,
} from "@/lib/services/experiments";

const createExperimentSchema = z.object({
  appId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  hypothesis: z.string().max(500).optional(),
  primaryMetric: z
    .enum(["conversion_rate", "revenue_per_user", "trial_to_paid"])
    .default("conversion_rate"),
  secondaryMetrics: z.array(z.string()).optional(),
  trafficAllocation: z.number().min(1).max(100).default(100),
  targetAudience: z
    .object({
      platforms: z.array(z.enum(["ios", "android"])).optional(),
      countries: z.array(z.string()).optional(),
      appVersions: z.array(z.string()).optional(),
      userAttributes: z.record(z.unknown()).optional(),
    })
    .optional(),
  // Initial variants
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
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
      })
    )
    .min(2)
    .optional(),
});

// GET /api/v1/experiments?appId=xxx - List experiments
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

  // Verify access
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

  const experiments = await getExperimentsByApp(appId);

  return NextResponse.json({ experiments });
}

// POST /api/v1/experiments - Create experiment
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createExperimentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Verify access
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

  // Create experiment
  const experiment = await createExperiment({
    appId: data.appId,
    name: data.name,
    description: data.description,
    hypothesis: data.hypothesis,
    primaryMetric: data.primaryMetric,
    secondaryMetrics: data.secondaryMetrics,
    trafficAllocation: data.trafficAllocation,
    targetAudience: data.targetAudience,
  });

  // Create initial variants if provided
  const variants = [];
  if (data.variants && data.variants.length > 0) {
    for (const variantInput of data.variants) {
      const variant = await createVariant({
        experimentId: experiment.id,
        ...variantInput,
      });
      variants.push(variant);
    }
  }

  return NextResponse.json({ experiment, variants }, { status: 201 });
}

