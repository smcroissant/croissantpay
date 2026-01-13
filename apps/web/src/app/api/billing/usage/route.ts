import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/services/organizations";
import { getOrganizationUsage, getOrganizationLimits, getUsageWarnings } from "@/lib/services/usage";
import { getSubscriptionInfo } from "@/lib/services/stripe";
import { isCloudMode, getPlanById, formatLimit, formatPrice } from "@/lib/config";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization
  const organizations = await getUserOrganizations(session.user.id);
  if (organizations.length === 0) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 400 }
    );
  }

  const organizationId = organizations[0].id;

  try {
    // Get usage, limits, and subscription info
    const [usage, limits, warnings, subscriptionInfo] = await Promise.all([
      getOrganizationUsage(organizationId),
      getOrganizationLimits(organizationId),
      getUsageWarnings(organizationId),
      getSubscriptionInfo(organizationId),
    ]);

    const plan = getPlanById(subscriptionInfo?.planId || "free");

    return NextResponse.json({
      isCloud: isCloudMode(),
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        price: formatPrice(plan.price),
      } : null,
      subscription: subscriptionInfo ? {
        status: subscriptionInfo.status,
        billingCycle: subscriptionInfo.billingCycle,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionInfo.cancelAtPeriodEnd,
      } : null,
      usage: {
        subscribers: {
          current: usage.subscribers,
          limit: limits.maxSubscribers,
          formatted: `${usage.subscribers.toLocaleString()} / ${formatLimit(limits.maxSubscribers)}`,
          percent: limits.maxSubscribers > 0 
            ? Math.round((usage.subscribers / limits.maxSubscribers) * 100)
            : 0,
        },
        apiRequests: {
          current: usage.apiRequests,
          limit: limits.maxApiRequests,
          formatted: `${usage.apiRequests.toLocaleString()} / ${formatLimit(limits.maxApiRequests)}`,
          percent: limits.maxApiRequests > 0
            ? Math.round((usage.apiRequests / limits.maxApiRequests) * 100)
            : 0,
        },
        apps: {
          current: usage.apps,
          limit: limits.maxApps,
          formatted: `${usage.apps} / ${formatLimit(limits.maxApps)}`,
          percent: limits.maxApps > 0
            ? Math.round((usage.apps / limits.maxApps) * 100)
            : 0,
        },
      },
      warnings,
    });
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

