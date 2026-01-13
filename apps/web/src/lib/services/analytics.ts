import { db } from "@/lib/db";
import { subscriber, subscription, purchase, product, app } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, count, inArray } from "drizzle-orm";

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  mrr: number;
  subscribersGrowth: number;
  revenueGrowth: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  subscriptions: number;
}

export interface SubscriberDataPoint {
  date: string;
  new: number;
  total: number;
  churned: number;
}

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  subscribers: number;
  platform: string;
}

// Helper to get subscriber IDs for an organization
async function getSubscriberIdsForOrg(appIds: string[]): Promise<string[]> {
  if (appIds.length === 0) return [];
  
  const subscribers = await db
    .select({ id: subscriber.id })
    .from(subscriber)
    .where(inArray(subscriber.appId, appIds));
  
  return subscribers.map((s) => s.id);
}

// Get dashboard overview stats for an organization
export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  // Get all app IDs for the organization
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return {
      totalSubscribers: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      mrr: 0,
      subscribersGrowth: 0,
      revenueGrowth: 0,
    };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Get subscriber IDs for all queries
  const subIds = await getSubscriberIdsForOrg(appIds);

  // Total subscribers
  const [subscriberCount] = await db
    .select({ count: count() })
    .from(subscriber)
    .where(inArray(subscriber.appId, appIds));

  // Active subscriptions
  const [activeSubCount] = subIds.length > 0
    ? await db
        .select({ count: count() })
        .from(subscription)
        .where(
          and(
            inArray(subscription.subscriberId, subIds),
            eq(subscription.status, "active")
          )
        )
    : [{ count: 0 }];

  // Total revenue (sum of purchase amounts)
  const [revenueResult] = subIds.length > 0
    ? await db
        .select({
          total: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
        })
        .from(purchase)
        .where(
          and(
            inArray(purchase.subscriberId, subIds),
            eq(purchase.status, "completed")
          )
        )
    : [{ total: 0 }];

  // MRR (Monthly Recurring Revenue) - active subscriptions
  const [mrrResult] = subIds.length > 0
    ? await db
        .select({
          mrr: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
        })
        .from(purchase)
        .innerJoin(subscription, eq(purchase.subscriberId, subscription.subscriberId))
        .where(
          and(
            inArray(purchase.subscriberId, subIds),
            eq(subscription.status, "active"),
            gte(purchase.purchaseDate, thirtyDaysAgo)
          )
        )
    : [{ mrr: 0 }];

  // Subscriber growth (last 30 days vs previous 30 days)
  const [currentPeriodSubs] = await db
    .select({ count: count() })
    .from(subscriber)
    .where(
      and(
        inArray(subscriber.appId, appIds),
        gte(subscriber.createdAt, thirtyDaysAgo)
      )
    );

  const [previousPeriodSubs] = await db
    .select({ count: count() })
    .from(subscriber)
    .where(
      and(
        inArray(subscriber.appId, appIds),
        gte(subscriber.createdAt, sixtyDaysAgo),
        lte(subscriber.createdAt, thirtyDaysAgo)
      )
    );

  const subscribersGrowth = previousPeriodSubs?.count
    ? ((currentPeriodSubs?.count || 0) - previousPeriodSubs.count) / previousPeriodSubs.count * 100
    : 0;

  // Revenue growth
  const [currentRevenue] = subIds.length > 0
    ? await db
        .select({
          total: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
        })
        .from(purchase)
        .where(
          and(
            inArray(purchase.subscriberId, subIds),
            eq(purchase.status, "completed"),
            gte(purchase.purchaseDate, thirtyDaysAgo)
          )
        )
    : [{ total: 0 }];

  const [previousRevenue] = subIds.length > 0
    ? await db
        .select({
          total: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
        })
        .from(purchase)
        .where(
          and(
            inArray(purchase.subscriberId, subIds),
            eq(purchase.status, "completed"),
            gte(purchase.purchaseDate, sixtyDaysAgo),
            lte(purchase.purchaseDate, thirtyDaysAgo)
          )
        )
    : [{ total: 0 }];

  const revenueGrowth = previousRevenue?.total
    ? ((currentRevenue?.total || 0) - previousRevenue.total) / previousRevenue.total * 100
    : 0;

  return {
    totalSubscribers: subscriberCount?.count || 0,
    activeSubscriptions: activeSubCount?.count || 0,
    totalRevenue: Number(revenueResult?.total || 0),
    mrr: Number(mrrResult?.mrr || 0),
    subscribersGrowth: Math.round(subscribersGrowth * 10) / 10,
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
  };
}

// Get revenue chart data
export async function getRevenueChart(
  organizationId: string,
  days: number = 30
): Promise<RevenueDataPoint[]> {
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return [];
  }

  const subIds = await getSubscriberIdsForOrg(appIds);
  
  if (subIds.length === 0) {
    // Return empty data for all days
    const data: RevenueDataPoint[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toISOString().split("T")[0],
        revenue: 0,
        subscriptions: 0,
      });
    }
    return data;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const results = await db
    .select({
      date: sql<string>`date_trunc('day', ${purchase.purchaseDate})::date`,
      revenue: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
      subscriptions: count(),
    })
    .from(purchase)
    .where(
      and(
        inArray(purchase.subscriberId, subIds),
        eq(purchase.status, "completed"),
        gte(purchase.purchaseDate, startDate)
      )
    )
    .groupBy(sql`date_trunc('day', ${purchase.purchaseDate})::date`)
    .orderBy(sql`date_trunc('day', ${purchase.purchaseDate})::date`);

  // Fill in missing dates
  const data: RevenueDataPoint[] = [];
  const dateMap = new Map(results.map((r) => [r.date, r]));

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const existing = dateMap.get(dateStr);
    data.push({
      date: dateStr,
      revenue: Number(existing?.revenue || 0),
      subscriptions: existing?.subscriptions || 0,
    });
  }

  return data;
}

// Get subscriber growth chart data
export async function getSubscriberChart(
  organizationId: string,
  days: number = 30
): Promise<SubscriberDataPoint[]> {
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return [];
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // New subscribers per day
  const newSubs = await db
    .select({
      date: sql<string>`date_trunc('day', ${subscriber.createdAt})::date`,
      count: count(),
    })
    .from(subscriber)
    .where(
      and(
        inArray(subscriber.appId, appIds),
        gte(subscriber.createdAt, startDate)
      )
    )
    .groupBy(sql`date_trunc('day', ${subscriber.createdAt})::date`)
    .orderBy(sql`date_trunc('day', ${subscriber.createdAt})::date`);

  // Get total count before start date
  const [totalBefore] = await db
    .select({ count: count() })
    .from(subscriber)
    .where(
      and(
        inArray(subscriber.appId, appIds),
        lte(subscriber.createdAt, startDate)
      )
    );

  // Fill in data
  const data: SubscriberDataPoint[] = [];
  const dateMap = new Map(newSubs.map((r) => [r.date, r.count]));
  let runningTotal = totalBefore?.count || 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const newCount = dateMap.get(dateStr) || 0;
    runningTotal += newCount;

    data.push({
      date: dateStr,
      new: newCount,
      total: runningTotal,
      churned: 0, // TODO: implement churn tracking
    });
  }

  return data;
}

// Get top products by revenue
export async function getTopProducts(
  organizationId: string,
  limit: number = 5
): Promise<TopProduct[]> {
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return [];
  }

  const results = await db
    .select({
      id: product.id,
      name: product.displayName,
      platform: product.platform,
      revenue: sql<number>`coalesce(sum(${purchase.priceAmountMicros}), 0) / 1000000`,
      subscribers: sql<number>`count(distinct ${purchase.subscriberId})`,
    })
    .from(purchase)
    .innerJoin(product, eq(purchase.productId, product.id))
    .where(
      and(
        inArray(product.appId, appIds),
        eq(purchase.status, "completed")
      )
    )
    .groupBy(product.id, product.displayName, product.platform)
    .orderBy(desc(sql`sum(${purchase.priceAmountMicros})`))
    .limit(limit);

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    platform: r.platform,
    revenue: Number(r.revenue),
    subscribers: Number(r.subscribers),
  }));
}

// Get recent activity
export async function getRecentActivity(
  organizationId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  type: "purchase" | "subscription" | "cancellation" | "refund";
  description: string;
  amount?: number;
  currency?: string;
  createdAt: Date;
}>> {
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return [];
  }

  const subIds = await getSubscriberIdsForOrg(appIds);
  
  if (subIds.length === 0) {
    return [];
  }

  const recentPurchases = await db
    .select({
      id: purchase.id,
      status: purchase.status,
      amount: purchase.priceAmountMicros,
      currency: purchase.priceCurrencyCode,
      productName: product.displayName,
      createdAt: purchase.createdAt,
    })
    .from(purchase)
    .innerJoin(product, eq(purchase.productId, product.id))
    .where(inArray(purchase.subscriberId, subIds))
    .orderBy(desc(purchase.createdAt))
    .limit(limit);

  return recentPurchases.map((p) => ({
    id: p.id,
    type: p.status === "refunded" ? "refund" : "purchase",
    description: `${p.status === "refunded" ? "Refund" : "Purchase"}: ${p.productName}`,
    amount: p.amount ? p.amount / 1000000 : undefined,
    currency: p.currency || undefined,
    createdAt: p.createdAt,
  }));
}

// Get platform distribution
export async function getPlatformDistribution(
  organizationId: string
): Promise<{ ios: number; android: number }> {
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return { ios: 0, android: 0 };
  }

  const subIds = await getSubscriberIdsForOrg(appIds);
  
  if (subIds.length === 0) {
    return { ios: 0, android: 0 };
  }

  const [iosCount] = await db
    .select({ count: count() })
    .from(subscription)
    .where(
      and(
        inArray(subscription.subscriberId, subIds),
        eq(subscription.platform, "ios")
      )
    );

  const [androidCount] = await db
    .select({ count: count() })
    .from(subscription)
    .where(
      and(
        inArray(subscription.subscriberId, subIds),
        eq(subscription.platform, "android")
      )
    );

  return {
    ios: iosCount?.count || 0,
    android: androidCount?.count || 0,
  };
}
