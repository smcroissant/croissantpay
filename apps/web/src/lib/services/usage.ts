import { db } from "@/lib/db";
import { organizationBilling, usageRecord } from "@/lib/db/schema-billing";
import { app, subscriber } from "@/lib/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";
import { isCloudMode, getPlanById, type PlanFeatures } from "@/lib/config";

export interface UsageStats {
  subscribers: number;
  apiRequests: number;
  apps: number;
  webhookEvents: number;
}

export interface UsageLimits {
  maxSubscribers: number;
  maxApiRequests: number;
  maxApps: number;
  teamMembers: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentUsed: number;
  metric: string;
}

// Get current usage stats for an organization
export async function getOrganizationUsage(
  organizationId: string
): Promise<UsageStats> {
  // Count subscribers across all apps
  const [subscriberCount] = await db
    .select({ count: count() })
    .from(subscriber)
    .innerJoin(app, eq(subscriber.appId, app.id))
    .where(eq(app.organizationId, organizationId));

  // Count apps
  const [appCount] = await db
    .select({ count: count() })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  // Get API requests from billing record (only in cloud mode)
  let apiRequests = 0;
  if (isCloudMode()) {
    try {
      const [billing] = await db
        .select()
        .from(organizationBilling)
        .where(eq(organizationBilling.organizationId, organizationId))
        .limit(1);
      apiRequests = billing?.currentApiRequests || 0;
    } catch {
      // Billing table may not exist in self-hosted mode
      apiRequests = 0;
    }
  }

  return {
    subscribers: subscriberCount?.count || 0,
    apiRequests,
    apps: appCount?.count || 0,
    webhookEvents: 0, // TODO: implement
  };
}

// Get organization's current plan limits
export async function getOrganizationLimits(
  organizationId: string
): Promise<UsageLimits> {
  // Self-hosted mode has no limits
  if (!isCloudMode()) {
    return {
      maxSubscribers: -1,
      maxApiRequests: -1,
      maxApps: -1,
      teamMembers: -1,
    };
  }

  try {
    const [billing] = await db
      .select()
      .from(organizationBilling)
      .where(eq(organizationBilling.organizationId, organizationId))
      .limit(1);

    const plan = getPlanById(billing?.planId || "free");
    const features = plan?.features;

    return {
      maxSubscribers: features?.maxSubscribers || 100,
      maxApiRequests: features?.maxApiRequests || 10_000,
      maxApps: features?.maxApps || 1,
      teamMembers: features?.teamMembers || 1,
    };
  } catch {
    // Billing table may not exist
    return {
      maxSubscribers: -1,
      maxApiRequests: -1,
      maxApps: -1,
      teamMembers: -1,
    };
  }
}

// Check if a specific action is allowed within usage limits
export async function checkUsageLimit(
  organizationId: string,
  metric: "subscribers" | "apiRequests" | "apps"
): Promise<UsageCheckResult> {
  // Self-hosted always allowed
  if (!isCloudMode()) {
    return {
      allowed: true,
      currentUsage: 0,
      limit: -1,
      percentUsed: 0,
      metric,
    };
  }

  const usage = await getOrganizationUsage(organizationId);
  const limits = await getOrganizationLimits(organizationId);

  const currentUsage = usage[metric];
  const limit =
    metric === "subscribers"
      ? limits.maxSubscribers
      : metric === "apiRequests"
      ? limits.maxApiRequests
      : limits.maxApps;

  // -1 means unlimited
  if (limit === -1) {
    return {
      allowed: true,
      currentUsage,
      limit: -1,
      percentUsed: 0,
      metric,
    };
  }

  const percentUsed = (currentUsage / limit) * 100;
  const allowed = currentUsage < limit;

  return {
    allowed,
    currentUsage,
    limit,
    percentUsed,
    metric,
  };
}

// Increment API request counter
export async function incrementApiRequests(
  organizationId: string,
  count: number = 1
): Promise<void> {
  if (!isCloudMode()) return;

  await db
    .update(organizationBilling)
    .set({
      currentApiRequests: sql`${organizationBilling.currentApiRequests} + ${count}`,
      updatedAt: new Date(),
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

// Reset monthly usage counters
export async function resetMonthlyUsage(organizationId: string): Promise<void> {
  if (!isCloudMode()) return;

  const now = new Date();
  const usage = await getOrganizationUsage(organizationId);

  // Record usage history before reset
  await db.insert(usageRecord).values({
    organizationId,
    metric: "api_requests",
    count: usage.apiRequests,
    periodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    periodEnd: new Date(now.getFullYear(), now.getMonth(), 0),
  });

  // Reset counters
  await db
    .update(organizationBilling)
    .set({
      currentApiRequests: 0,
      usageResetAt: now,
      updatedAt: now,
    })
    .where(eq(organizationBilling.organizationId, organizationId));
}

// Initialize billing record for new organization
export async function initializeOrganizationBilling(
  organizationId: string,
  planId: string = "free"
): Promise<void> {
  if (!isCloudMode()) return;

  const existing = await db
    .select()
    .from(organizationBilling)
    .where(eq(organizationBilling.organizationId, organizationId))
    .limit(1);

  if (existing.length > 0) return;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.insert(organizationBilling).values({
    organizationId,
    planId,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    usageResetAt: now,
  });
}

// Get usage warnings for dashboard
export async function getUsageWarnings(
  organizationId: string
): Promise<Array<{ metric: string; message: string; severity: "warning" | "critical" }>> {
  if (!isCloudMode()) return [];

  const warnings: Array<{ metric: string; message: string; severity: "warning" | "critical" }> = [];

  const checks = await Promise.all([
    checkUsageLimit(organizationId, "subscribers"),
    checkUsageLimit(organizationId, "apiRequests"),
    checkUsageLimit(organizationId, "apps"),
  ]);

  for (const check of checks) {
    if (check.limit === -1) continue;

    if (check.percentUsed >= 100) {
      warnings.push({
        metric: check.metric,
        message: `You've reached your ${check.metric} limit. Upgrade your plan to continue.`,
        severity: "critical",
      });
    } else if (check.percentUsed >= 80) {
      warnings.push({
        metric: check.metric,
        message: `You're using ${check.percentUsed.toFixed(0)}% of your ${check.metric} limit.`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

