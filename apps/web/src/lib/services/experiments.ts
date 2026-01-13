import { db } from "@/lib/db";
import {
  experiment,
  experimentVariant,
  experimentAssignment,
  subscriber,
  offering,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import crypto from "crypto";

// Types
export type ExperimentStatus = "draft" | "running" | "paused" | "completed" | "archived";

export interface CreateExperimentInput {
  appId: string;
  name: string;
  description?: string;
  hypothesis?: string;
  primaryMetric?: string;
  secondaryMetrics?: string[];
  trafficAllocation?: number;
  targetAudience?: {
    platforms?: ("ios" | "android")[];
    countries?: string[];
    appVersions?: string[];
    userAttributes?: Record<string, unknown>;
  };
}

export interface CreateVariantInput {
  experimentId: string;
  name: string;
  description?: string;
  isControl?: boolean;
  weight?: number;
  offeringId?: string;
  customProducts?: Array<{
    productId: string;
    position: number;
    highlighted?: boolean;
    badge?: string;
  }>;
  paywallConfig?: {
    title?: string;
    subtitle?: string;
    features?: string[];
    ctaText?: string;
    theme?: string;
  };
}

export interface ExperimentWithVariants {
  experiment: typeof experiment.$inferSelect;
  variants: Array<typeof experimentVariant.$inferSelect>;
}

export interface ExperimentResults {
  experiment: typeof experiment.$inferSelect;
  variants: Array<{
    variant: typeof experimentVariant.$inferSelect;
    conversionRate: number;
    revenuePerUser: number;
    trialConversionRate: number;
    improvement?: number; // vs control
    isSignificant?: boolean;
  }>;
  totalParticipants: number;
  totalConversions: number;
  totalRevenue: number;
}

// Create experiment
export async function createExperiment(
  input: CreateExperimentInput
): Promise<typeof experiment.$inferSelect> {
  const [newExperiment] = await db
    .insert(experiment)
    .values({
      appId: input.appId,
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      primaryMetric: input.primaryMetric || "conversion_rate",
      secondaryMetrics: input.secondaryMetrics,
      trafficAllocation: input.trafficAllocation ?? 100,
      targetAudience: input.targetAudience,
    })
    .returning();

  return newExperiment;
}

// Get experiment by ID
export async function getExperiment(
  experimentId: string
): Promise<ExperimentWithVariants | null> {
  const [exp] = await db
    .select()
    .from(experiment)
    .where(eq(experiment.id, experimentId))
    .limit(1);

  if (!exp) return null;

  const variants = await db
    .select()
    .from(experimentVariant)
    .where(eq(experimentVariant.experimentId, experimentId))
    .orderBy(experimentVariant.createdAt);

  return { experiment: exp, variants };
}

// Get experiments for an app
export async function getExperimentsByApp(
  appId: string
): Promise<Array<ExperimentWithVariants>> {
  const experiments = await db
    .select()
    .from(experiment)
    .where(eq(experiment.appId, appId))
    .orderBy(desc(experiment.createdAt));

  const results: Array<ExperimentWithVariants> = [];

  for (const exp of experiments) {
    const variants = await db
      .select()
      .from(experimentVariant)
      .where(eq(experimentVariant.experimentId, exp.id));

    results.push({ experiment: exp, variants });
  }

  return results;
}

// Get running experiments for an app
export async function getRunningExperiments(
  appId: string
): Promise<Array<ExperimentWithVariants>> {
  const experiments = await db
    .select()
    .from(experiment)
    .where(
      and(
        eq(experiment.appId, appId),
        eq(experiment.status, "running")
      )
    );

  const results: Array<ExperimentWithVariants> = [];

  for (const exp of experiments) {
    const variants = await db
      .select()
      .from(experimentVariant)
      .where(eq(experimentVariant.experimentId, exp.id));

    results.push({ experiment: exp, variants });
  }

  return results;
}

// Update experiment
export async function updateExperiment(
  experimentId: string,
  updates: Partial<CreateExperimentInput> & { status?: ExperimentStatus }
): Promise<typeof experiment.$inferSelect> {
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date(),
  };

  // Set started/ended timestamps based on status
  if (updates.status === "running") {
    updateData.startedAt = new Date();
  } else if (updates.status === "completed") {
    updateData.endedAt = new Date();
  }

  const [updated] = await db
    .update(experiment)
    .set(updateData)
    .where(eq(experiment.id, experimentId))
    .returning();

  return updated;
}

// Delete experiment
export async function deleteExperiment(experimentId: string): Promise<void> {
  await db.delete(experiment).where(eq(experiment.id, experimentId));
}

// Create variant
export async function createVariant(
  input: CreateVariantInput
): Promise<typeof experimentVariant.$inferSelect> {
  const [newVariant] = await db
    .insert(experimentVariant)
    .values({
      experimentId: input.experimentId,
      name: input.name,
      description: input.description,
      isControl: input.isControl ?? false,
      weight: input.weight ?? 50,
      offeringId: input.offeringId,
      customProducts: input.customProducts,
      paywallConfig: input.paywallConfig,
    })
    .returning();

  return newVariant;
}

// Update variant
export async function updateVariant(
  variantId: string,
  updates: Partial<CreateVariantInput>
): Promise<typeof experimentVariant.$inferSelect> {
  const [updated] = await db
    .update(experimentVariant)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(experimentVariant.id, variantId))
    .returning();

  return updated;
}

// Delete variant
export async function deleteVariant(variantId: string): Promise<void> {
  await db.delete(experimentVariant).where(eq(experimentVariant.id, variantId));
}

// Assign subscriber to experiment variant
export async function assignToExperiment(
  experimentId: string,
  subscriberId: string,
  metadata?: { platform?: string; appVersion?: string; country?: string }
): Promise<typeof experimentAssignment.$inferSelect | null> {
  // Check if already assigned
  const [existing] = await db
    .select()
    .from(experimentAssignment)
    .where(
      and(
        eq(experimentAssignment.experimentId, experimentId),
        eq(experimentAssignment.subscriberId, subscriberId)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  // Get experiment
  const [exp] = await db
    .select()
    .from(experiment)
    .where(eq(experiment.id, experimentId))
    .limit(1);

  if (!exp || exp.status !== "running") {
    return null;
  }

  // Check traffic allocation
  const random = Math.random() * 100;
  if (random > exp.trafficAllocation) {
    return null; // User not in experiment
  }

  // Check targeting
  if (exp.targetAudience) {
    const audience = exp.targetAudience as {
      platforms?: string[];
      countries?: string[];
      appVersions?: string[];
    };

    if (
      audience.platforms &&
      metadata?.platform &&
      !audience.platforms.includes(metadata.platform)
    ) {
      return null;
    }

    if (
      audience.countries &&
      metadata?.country &&
      !audience.countries.includes(metadata.country)
    ) {
      return null;
    }
  }

  // Get variants
  const variants = await db
    .select()
    .from(experimentVariant)
    .where(eq(experimentVariant.experimentId, experimentId));

  if (variants.length === 0) {
    return null;
  }

  // Assign based on weights
  const selectedVariant = selectVariantByWeight(variants, subscriberId);

  // Create assignment
  const [assignment] = await db
    .insert(experimentAssignment)
    .values({
      experimentId,
      variantId: selectedVariant.id,
      subscriberId,
      metadata,
    })
    .returning();

  // Increment variant impressions
  await db
    .update(experimentVariant)
    .set({
      impressions: sql`${experimentVariant.impressions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(experimentVariant.id, selectedVariant.id));

  return assignment;
}

// Get subscriber's variant assignment
export async function getSubscriberAssignment(
  experimentId: string,
  subscriberId: string
): Promise<{
  assignment: typeof experimentAssignment.$inferSelect;
  variant: typeof experimentVariant.$inferSelect;
} | null> {
  const [result] = await db
    .select({
      assignment: experimentAssignment,
      variant: experimentVariant,
    })
    .from(experimentAssignment)
    .innerJoin(
      experimentVariant,
      eq(experimentAssignment.variantId, experimentVariant.id)
    )
    .where(
      and(
        eq(experimentAssignment.experimentId, experimentId),
        eq(experimentAssignment.subscriberId, subscriberId)
      )
    )
    .limit(1);

  return result || null;
}

// Track conversion
export async function trackConversion(
  experimentId: string,
  subscriberId: string,
  conversionType: string,
  revenue?: number
): Promise<void> {
  // Get assignment
  const [assignment] = await db
    .select()
    .from(experimentAssignment)
    .where(
      and(
        eq(experimentAssignment.experimentId, experimentId),
        eq(experimentAssignment.subscriberId, subscriberId)
      )
    )
    .limit(1);

  if (!assignment || assignment.converted) {
    return; // No assignment or already converted
  }

  // Update assignment
  await db
    .update(experimentAssignment)
    .set({
      converted: true,
      convertedAt: new Date(),
      conversionType,
      revenue: revenue || 0,
    })
    .where(eq(experimentAssignment.id, assignment.id));

  // Update variant stats
  const updateData: Record<string, unknown> = {
    conversions: sql`${experimentVariant.conversions} + 1`,
    updatedAt: new Date(),
  };

  if (revenue) {
    updateData.revenue = sql`${experimentVariant.revenue} + ${revenue}`;
  }

  if (conversionType === "trial_start") {
    updateData.trials = sql`${experimentVariant.trials} + 1`;
  } else if (conversionType === "trial_convert") {
    updateData.trialConversions = sql`${experimentVariant.trialConversions} + 1`;
  }

  await db
    .update(experimentVariant)
    .set(updateData)
    .where(eq(experimentVariant.id, assignment.variantId));
}

// Get experiment results
export async function getExperimentResults(
  experimentId: string
): Promise<ExperimentResults | null> {
  const expWithVariants = await getExperiment(experimentId);
  if (!expWithVariants) return null;

  const { experiment: exp, variants } = expWithVariants;

  // Find control variant
  const control = variants.find((v) => v.isControl);

  // Calculate stats for each variant
  const variantResults = variants.map((v) => {
    const conversionRate =
      v.impressions > 0 ? (v.conversions / v.impressions) * 100 : 0;
    const revenuePerUser = v.impressions > 0 ? v.revenue / v.impressions : 0;
    const trialConversionRate =
      v.trials > 0 ? (v.trialConversions / v.trials) * 100 : 0;

    let improvement: number | undefined;
    if (control && !v.isControl && control.impressions > 0) {
      const controlConversionRate =
        (control.conversions / control.impressions) * 100;
      if (controlConversionRate > 0) {
        improvement =
          ((conversionRate - controlConversionRate) / controlConversionRate) *
          100;
      }
    }

    // Simple significance check (would use proper stats in production)
    const isSignificant =
      v.impressions >= 100 &&
      control &&
      control.impressions >= 100 &&
      improvement !== undefined &&
      Math.abs(improvement) > 10;

    return {
      variant: v,
      conversionRate,
      revenuePerUser,
      trialConversionRate,
      improvement,
      isSignificant,
    };
  });

  // Calculate totals
  const totalParticipants = variants.reduce((sum, v) => sum + v.impressions, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
  const totalRevenue = variants.reduce((sum, v) => sum + v.revenue, 0);

  return {
    experiment: exp,
    variants: variantResults,
    totalParticipants,
    totalConversions,
    totalRevenue,
  };
}

// Conclude experiment
export async function concludeExperiment(
  experimentId: string,
  winningVariantId?: string
): Promise<typeof experiment.$inferSelect> {
  const [updated] = await db
    .update(experiment)
    .set({
      status: "completed",
      endedAt: new Date(),
      winningVariantId,
      updatedAt: new Date(),
    })
    .where(eq(experiment.id, experimentId))
    .returning();

  return updated;
}

// Helper: Select variant by weight (deterministic based on subscriber ID)
function selectVariantByWeight(
  variants: Array<typeof experimentVariant.$inferSelect>,
  subscriberId: string
): typeof experimentVariant.$inferSelect {
  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  // Use subscriber ID to get a deterministic random number
  const hash = crypto.createHash("md5").update(subscriberId).digest("hex");
  const hashValue = parseInt(hash.substring(0, 8), 16);
  const normalizedValue = (hashValue / 0xffffffff) * totalWeight;

  // Select variant based on weight ranges
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (normalizedValue < cumulative) {
      return variant;
    }
  }

  // Fallback to last variant
  return variants[variants.length - 1];
}

// Get offering for subscriber (considering experiments)
export async function getOfferingForSubscriber(
  appId: string,
  subscriberId: string,
  metadata?: { platform?: string; appVersion?: string; country?: string }
): Promise<{
  offeringId?: string;
  experimentId?: string;
  variantId?: string;
  paywallConfig?: Record<string, unknown>;
  customProducts?: Array<unknown>;
} | null> {
  // Get running experiments
  const experiments = await getRunningExperiments(appId);

  for (const { experiment: exp, variants } of experiments) {
    // Try to assign to experiment
    const assignment = await assignToExperiment(exp.id, subscriberId, metadata);

    if (assignment) {
      // Get the variant
      const variant = variants.find((v) => v.id === assignment.variantId);
      if (variant) {
        return {
          offeringId: variant.offeringId || undefined,
          experimentId: exp.id,
          variantId: variant.id,
          paywallConfig: variant.paywallConfig || undefined,
          customProducts: variant.customProducts || undefined,
        };
      }
    }
  }

  return null;
}

// Start experiment
export async function startExperiment(
  experimentId: string
): Promise<typeof experiment.$inferSelect> {
  const [updated] = await db
    .update(experiment)
    .set({
      status: "running",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(experiment.id, experimentId))
    .returning();

  return updated;
}

// Pause experiment
export async function pauseExperiment(
  experimentId: string
): Promise<typeof experiment.$inferSelect> {
  const [updated] = await db
    .update(experiment)
    .set({
      status: "paused",
      updatedAt: new Date(),
    })
    .where(eq(experiment.id, experimentId))
    .returning();

  return updated;
}

// Complete experiment
export async function completeExperiment(
  experimentId: string,
  winningVariantId?: string
): Promise<typeof experiment.$inferSelect> {
  const [updated] = await db
    .update(experiment)
    .set({
      status: "completed",
      endedAt: new Date(),
      winningVariantId: winningVariantId || null,
      updatedAt: new Date(),
    })
    .where(eq(experiment.id, experimentId))
    .returning();

  return updated;
}

