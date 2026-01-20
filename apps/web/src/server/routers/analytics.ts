import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
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
import { getApp, getAppsByOrganization } from "@/lib/services/apps";
import { TRPCError } from "@trpc/server";
import { db } from "@/lib/db";
import { webhookEvent, app } from "@/lib/db/schema";
import { inArray, desc } from "drizzle-orm";

export const analyticsRouter = createTRPCRouter({
  // Get dashboard stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardStats(ctx.organizationId);
  }),

  // Get revenue chart data
  revenueChart: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      return getRevenueChart(ctx.organizationId, input.days);
    }),

  // Get subscriber chart data
  subscriberChart: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      return getSubscriberChart(ctx.organizationId, input.days);
    }),

  // Get top products
  topProducts: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(5) }))
    .query(async ({ ctx, input }) => {
      return getTopProducts(ctx.organizationId, input.limit);
    }),

  // Get recent activity
  recentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      return getRecentActivity(ctx.organizationId, input.limit);
    }),

  // Get platform distribution
  platformDistribution: protectedProcedure.query(async ({ ctx }) => {
    return getPlatformDistribution(ctx.organizationId);
  }),

  // Get usage data
  usage: protectedProcedure.query(async ({ ctx }) => {
    const [usage, warnings] = await Promise.all([
      getOrganizationUsage(ctx.organizationId),
      getUsageWarnings(ctx.organizationId),
    ]);

    return { usage, warnings };
  }),

  // Get webhook stats for an app
  webhookStats: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getWebhookStats(input.appId);
    }),

  // Get recent webhook events for an app
  webhookEvents: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const appData = await getApp(input.appId);
      if (!appData || appData.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getRecentWebhookEvents(input.appId, input.limit);
    }),

  // Get all webhook events for all apps in organization
  webhookEventsAll: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const apps = await getAppsByOrganization(ctx.organizationId);

      if (apps.length === 0) {
        return [];
      }

      const appIds = apps.map((a) => a.id);

      const events = await db
        .select({
          id: webhookEvent.id,
          eventType: webhookEvent.eventType,
          platform: webhookEvent.platform,
          environment: webhookEvent.environment,
          processedAt: webhookEvent.processedAt,
          error: webhookEvent.error,
          createdAt: webhookEvent.createdAt,
        })
        .from(webhookEvent)
        .where(inArray(webhookEvent.appId, appIds))
        .orderBy(desc(webhookEvent.createdAt))
        .limit(input.limit);

      // Transform to include derived source and status fields
      return events.map((event) => {
        let status: string;
        if (event.error) {
          status = "failed";
        } else if (event.processedAt) {
          status = "processed";
        } else {
          status = "pending";
        }

        return {
          id: event.id,
          eventType: event.eventType,
          source: event.platform, // 'ios' or 'android'
          status,
          environment: event.environment,
          createdAt: event.createdAt,
        };
      });
    }),
});

