import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationBilling } from "@/lib/db/schema-billing";
import { app, subscriber, organizationMember } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { isCloudMode, getPlanById, PLANS, type Plan, type PlanFeatures } from "@/lib/config";

export interface PlanLimitError {
  code: "PLAN_LIMIT_EXCEEDED";
  message: string;
  metric: string;
  currentUsage: number;
  limit: number;
  upgradeUrl: string;
}

export interface PlanLimitsContext {
  organizationId: string;
  plan: Plan;
  features: PlanFeatures;
  usage: {
    apps: number;
    subscribers: number;
    apiRequests: number;
    teamMembers: number;
  };
}

// Get organization's plan and current usage
export async function getPlanLimitsContext(
  organizationId: string
): Promise<PlanLimitsContext | null> {
  // Self-hosted has no limits
  if (!isCloudMode()) {
    const selfHostedPlan = {
      id: "self-hosted",
      name: "Self-Hosted",
      description: "Unlimited",
      price: 0,
      yearlyPrice: 0,
      features: {
        maxApps: -1,
        maxSubscribers: -1,
        maxApiRequests: -1,
        webhookRetention: -1,
        analyticsRetention: -1,
        teamMembers: -1,
        prioritySupport: false,
        customBranding: true,
        sla: null,
        dedicatedSupport: false,
      },
    };
    return {
      organizationId,
      plan: selfHostedPlan,
      features: selfHostedPlan.features,
      usage: { apps: 0, subscribers: 0, apiRequests: 0, teamMembers: 0 },
    };
  }

  try {
    // Get billing info
    const [billing] = await db
      .select()
      .from(organizationBilling)
      .where(eq(organizationBilling.organizationId, organizationId))
      .limit(1);

    const plan = getPlanById(billing?.planId || "free") || PLANS[0];

    // Get current usage
    const [appCount] = await db
      .select({ count: count() })
      .from(app)
      .where(eq(app.organizationId, organizationId));

    const [memberCount] = await db
      .select({ count: count() })
      .from(organizationMember)
      .where(eq(organizationMember.organizationId, organizationId));

    // Count subscribers across all org apps
    const subscriberCountResult = await db
      .select({ count: count() })
      .from(subscriber)
      .innerJoin(app, eq(subscriber.appId, app.id))
      .where(eq(app.organizationId, organizationId));

    return {
      organizationId,
      plan,
      features: plan.features,
      usage: {
        apps: appCount?.count || 0,
        subscribers: subscriberCountResult[0]?.count || 0,
        apiRequests: billing?.currentApiRequests || 0,
        teamMembers: memberCount?.count || 0,
      },
    };
  } catch (error) {
    console.error("Failed to get plan limits context:", error);
    return null;
  }
}

// Check if creating a new app is allowed
export async function canCreateApp(
  organizationId: string
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
  if (!isCloudMode()) return { allowed: true };

  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return { allowed: true }; // Fail open if can't get context

  const { features, usage } = ctx;

  if (features.maxApps !== -1 && usage.apps >= features.maxApps) {
    return {
      allowed: false,
      error: {
        code: "PLAN_LIMIT_EXCEEDED",
        message: `You've reached your app limit (${features.maxApps} apps). Upgrade your plan to create more apps.`,
        metric: "apps",
        currentUsage: usage.apps,
        limit: features.maxApps,
        upgradeUrl: `/dashboard/${organizationId}/settings?tab=billing`,
      },
    };
  }

  return { allowed: true };
}

// Check if adding a new subscriber is allowed
export async function canAddSubscriber(
  organizationId: string
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
  if (!isCloudMode()) return { allowed: true };

  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return { allowed: true };

  const { features, usage } = ctx;

  if (features.maxSubscribers !== -1 && usage.subscribers >= features.maxSubscribers) {
    return {
      allowed: false,
      error: {
        code: "PLAN_LIMIT_EXCEEDED",
        message: `You've reached your subscriber limit (${features.maxSubscribers.toLocaleString()} subscribers). Upgrade your plan to add more subscribers.`,
        metric: "subscribers",
        currentUsage: usage.subscribers,
        limit: features.maxSubscribers,
        upgradeUrl: `/dashboard/${organizationId}/settings?tab=billing`,
      },
    };
  }

  return { allowed: true };
}

// Check if adding a team member is allowed
export async function canAddTeamMember(
  organizationId: string
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
  if (!isCloudMode()) return { allowed: true };

  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return { allowed: true };

  const { features, usage } = ctx;

  if (features.teamMembers !== -1 && usage.teamMembers >= features.teamMembers) {
    return {
      allowed: false,
      error: {
        code: "PLAN_LIMIT_EXCEEDED",
        message: `You've reached your team member limit (${features.teamMembers} members). Upgrade your plan to invite more team members.`,
        metric: "teamMembers",
        currentUsage: usage.teamMembers,
        limit: features.teamMembers,
        upgradeUrl: `/dashboard/${organizationId}/settings?tab=billing`,
      },
    };
  }

  return { allowed: true };
}

// Check if API request is allowed and track usage
export async function checkAndTrackApiRequest(
  organizationId: string
): Promise<{ allowed: boolean; error?: PlanLimitError }> {
  if (!isCloudMode()) return { allowed: true };

  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return { allowed: true };

  const { features, usage } = ctx;

  // Check limit before incrementing
  if (features.maxApiRequests !== -1 && usage.apiRequests >= features.maxApiRequests) {
    return {
      allowed: false,
      error: {
        code: "PLAN_LIMIT_EXCEEDED",
        message: `You've exceeded your monthly API request limit (${features.maxApiRequests.toLocaleString()} requests). Upgrade your plan for more requests.`,
        metric: "apiRequests",
        currentUsage: usage.apiRequests,
        limit: features.maxApiRequests,
        upgradeUrl: `/dashboard/${organizationId}/settings?tab=billing`,
      },
    };
  }

  // Increment API request counter
  try {
    await db
      .update(organizationBilling)
      .set({
        currentApiRequests: sql`${organizationBilling.currentApiRequests} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(organizationBilling.organizationId, organizationId));
  } catch (error) {
    console.error("Failed to increment API requests:", error);
  }

  return { allowed: true };
}

// Create a NextResponse for plan limit errors
export function createPlanLimitErrorResponse(error: PlanLimitError): NextResponse {
  return NextResponse.json(
    {
      error: error.code,
      message: error.message,
      metric: error.metric,
      currentUsage: error.currentUsage,
      limit: error.limit,
      upgradeUrl: error.upgradeUrl,
    },
    { status: 402 } // Payment Required
  );
}

// Get recommended plan for an organization based on usage
export async function getRecommendedPlan(
  organizationId: string
): Promise<Plan | null> {
  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return null;

  const { usage } = ctx;

  // Find the cheapest plan that fits the usage
  for (const plan of PLANS) {
    if (plan.id === "enterprise") continue;

    const fits =
      (plan.features.maxApps === -1 || plan.features.maxApps > usage.apps) &&
      (plan.features.maxSubscribers === -1 || plan.features.maxSubscribers > usage.subscribers) &&
      (plan.features.maxApiRequests === -1 || plan.features.maxApiRequests > usage.apiRequests) &&
      (plan.features.teamMembers === -1 || plan.features.teamMembers > usage.teamMembers);

    if (fits && plan.price > 0) {
      return plan;
    }
  }

  // If no plan fits, recommend enterprise
  return PLANS.find((p) => p.id === "enterprise") || null;
}

// Get usage percentage for a metric
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0;
  return Math.min(100, (current / limit) * 100);
}

// Check if organization is near any limits (for warnings)
export async function getUsageWarnings(
  organizationId: string
): Promise<Array<{ metric: string; percentage: number; severity: "warning" | "critical" }>> {
  if (!isCloudMode()) return [];

  const ctx = await getPlanLimitsContext(organizationId);
  if (!ctx) return [];

  const warnings: Array<{ metric: string; percentage: number; severity: "warning" | "critical" }> = [];
  const { features, usage } = ctx;

  const metrics = [
    { name: "apps", current: usage.apps, limit: features.maxApps },
    { name: "subscribers", current: usage.subscribers, limit: features.maxSubscribers },
    { name: "apiRequests", current: usage.apiRequests, limit: features.maxApiRequests },
    { name: "teamMembers", current: usage.teamMembers, limit: features.teamMembers },
  ];

  for (const metric of metrics) {
    if (metric.limit === -1) continue;

    const percentage = getUsagePercentage(metric.current, metric.limit);

    if (percentage >= 100) {
      warnings.push({ metric: metric.name, percentage, severity: "critical" });
    } else if (percentage >= 80) {
      warnings.push({ metric: metric.name, percentage, severity: "warning" });
    }
  }

  return warnings;
}

