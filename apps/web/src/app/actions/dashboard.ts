"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/services/organizations";
import {
  getDashboardStats,
  getRevenueChart,
  getSubscriberChart,
  getTopProducts,
  getRecentActivity,
  getPlatformDistribution,
} from "@/lib/services/analytics";
import { getOrganizationUsage, getUsageWarnings } from "@/lib/services/usage";
import { getWebhookStats, getRecentWebhookEvents } from "@/lib/services/webhooks";
import { getPromoCodesByApp } from "@/lib/services/promo-codes";
import { getExperimentsByApp } from "@/lib/services/experiments";
import { db } from "@/lib/db";
import { app, subscriber, product } from "@/lib/db/schema";
import { eq, desc, inArray, sql } from "drizzle-orm";

// Get current user's organization ID
async function getCurrentOrganizationId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const organizations = await getUserOrganizations(session.user.id);
  return organizations[0]?.id || null;
}

// Dashboard overview
export async function fetchDashboardStats() {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return null;

  return getDashboardStats(organizationId);
}

// Revenue chart data
export async function fetchRevenueChart(days: number = 30) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  return getRevenueChart(organizationId, days);
}

// Subscriber chart data
export async function fetchSubscriberChart(days: number = 30) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  return getSubscriberChart(organizationId, days);
}

// Top products
export async function fetchTopProducts(limit: number = 5) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  return getTopProducts(organizationId, limit);
}

// Recent activity
export async function fetchRecentActivity(limit: number = 10) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  return getRecentActivity(organizationId, limit);
}

// Platform distribution
export async function fetchPlatformDistribution() {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return { ios: 0, android: 0 };

  return getPlatformDistribution(organizationId);
}

// Usage data
export async function fetchUsageData() {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return null;

  const [usage, warnings] = await Promise.all([
    getOrganizationUsage(organizationId),
    getUsageWarnings(organizationId),
  ]);

  return { usage, warnings };
}

// Get all apps for the organization
export async function fetchApps() {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  const apps = await db
    .select()
    .from(app)
    .where(eq(app.organizationId, organizationId))
    .orderBy(desc(app.createdAt));

  return apps;
}

// Get app details with stats
export async function fetchAppDetails(appId: string) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return null;

  const [appData] = await db
    .select()
    .from(app)
    .where(eq(app.id, appId))
    .limit(1);

  if (!appData || appData.organizationId !== organizationId) {
    return null;
  }

  // Get subscriber count
  const [subscriberCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriber)
    .where(eq(subscriber.appId, appId));

  // Get product count
  const [productCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(product)
    .where(eq(product.appId, appId));

  // Get webhook stats
  const webhookStats = await getWebhookStats(appId);

  return {
    ...appData,
    subscriberCount: subscriberCount?.count || 0,
    productCount: productCount?.count || 0,
    webhookStats,
  };
}

// Get recent subscribers
export async function fetchRecentSubscribers(limit: number = 10) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) return [];

  const subscribers = await db
    .select()
    .from(subscriber)
    .where(inArray(subscriber.appId, appIds))
    .orderBy(desc(subscriber.createdAt))
    .limit(limit);

  return subscribers;
}

// Get products for organization
export async function fetchProducts() {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) return [];

  const products = await db
    .select()
    .from(product)
    .where(inArray(product.appId, appIds))
    .orderBy(desc(product.createdAt));

  return products;
}

// Get webhook events for an app
export async function fetchWebhookEvents(limit: number = 50) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  // Get all apps for the organization
  const apps = await db
    .select()
    .from(app)
    .where(eq(app.organizationId, organizationId));

  if (apps.length === 0) return [];

  // Fetch webhook events for all apps
  const allEvents: Array<{
    id: string;
    eventType: string;
    source: string;
    status: string;
    createdAt: Date;
  }> = [];

  for (const appData of apps) {
    const events = await getRecentWebhookEvents(appData.id, limit);
    for (const event of events) {
      allEvents.push({
        id: event.id,
        eventType: event.eventType,
        source: event.source,
        status: event.status,
        createdAt: event.createdAt,
      });
    }
  }

  // Sort by date and limit
  return allEvents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Get promo codes for an app
export async function fetchPromoCodes(appId?: string) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  // Get all apps for the organization
  const apps = await db
    .select()
    .from(app)
    .where(eq(app.organizationId, organizationId));

  if (apps.length === 0) return [];

  // If appId provided, verify it belongs to the organization
  if (appId) {
    const appExists = apps.some((a) => a.id === appId);
    if (!appExists) return [];
    return getPromoCodesByApp(appId);
  }

  // Fetch promo codes for all apps
  const allPromoCodes: Array<{
    id: string;
    code: string;
    type: string;
    discountAmount: number | null;
    isActive: boolean;
    maxRedemptions: number | null;
    redemptionCount: number;
    expiresAt: Date | null;
  }> = [];

  for (const appData of apps) {
    const results = await getPromoCodesByApp(appData.id);
    for (const promo of results) {
      allPromoCodes.push({
        id: promo.id,
        code: promo.code,
        type: promo.type,
        discountAmount: promo.discountAmount,
        isActive: promo.isActive,
        maxRedemptions: promo.maxRedemptions,
        redemptionCount: promo.currentRedemptions,
        expiresAt: promo.expiresAt,
      });
    }
  }

  return allPromoCodes;
}

// Get experiments for organization (optionally filtered by app)
export async function fetchExperiments(appId?: string) {
  const organizationId = await getCurrentOrganizationId();
  if (!organizationId) return [];

  // Get all apps for the organization
  const apps = await db
    .select()
    .from(app)
    .where(eq(app.organizationId, organizationId));

  if (apps.length === 0) return [];

  // If appId provided, verify it belongs to the organization
  if (appId) {
    const appExists = apps.some((a) => a.id === appId);
    if (!appExists) return [];

    const results = await getExperimentsByApp(appId);
    return results.map((r) => ({
      id: r.experiment.id,
      name: r.experiment.name,
      description: r.experiment.description,
      status: r.experiment.status,
      participantCount: 0,
      conversionRate: 0,
      variants: r.variants.map((v) => ({ name: v.name })),
    }));
  }

  // Fetch experiments for all apps
  const allExperiments: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    participantCount: number;
    conversionRate: number;
    variants: Array<{ name: string }>;
  }> = [];

  for (const appData of apps) {
    const results = await getExperimentsByApp(appData.id);
    for (const r of results) {
      allExperiments.push({
        id: r.experiment.id,
        name: r.experiment.name,
        description: r.experiment.description,
        status: r.experiment.status,
        participantCount: 0,
        conversionRate: 0,
        variants: r.variants.map((v) => ({ name: v.name })),
      });
    }
  }

  return allExperiments;
}

