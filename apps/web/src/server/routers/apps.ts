import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  appProcedure,
} from "@/server/trpc";
import {
  createApp,
  getApp,
  getAppsByOrganization,
  updateApp,
  deleteApp,
  regenerateApiKeys,
  configureWebhook,
  regenerateWebhookIds,
} from "@/lib/services/apps";
import { getWebhookStats } from "@/lib/services/webhooks";
import {
  getWebhookDeliveries,
  getWebhookDeliveryStats,
  retryWebhookDelivery,
  sendCustomerWebhook,
} from "@/lib/services/customer-webhooks";
import { canCreateApp } from "@/lib/api/plan-limits";
import { db } from "@/lib/db";
import { subscriber, subscription, product, webhookDelivery } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export const appsRouter = createTRPCRouter({
  // List all apps
  list: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    // Get stats for each app
    const appsWithStats = await Promise.all(
      apps.map(async (app) => {
        const [subscriberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(subscriber)
          .where(eq(subscriber.appId, app.id));

        const [activeSubCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(subscription)
          .innerJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
          .where(
            and(eq(subscriber.appId, app.id), eq(subscription.status, "active"))
          );

        return {
          ...app,
          subscriberCount: Number(subscriberCount?.count || 0),
          activeSubscriptions: Number(activeSubCount?.count || 0),
        };
      })
    );

    return appsWithStats;
  }),

  // Get single app by ID
  get: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      // Get stats
      const [subscriberCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriber)
        .where(eq(subscriber.appId, input.appId));

      const [productCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(product)
        .where(eq(product.appId, input.appId));

      const webhookStats = await getWebhookStats(input.appId);

      return {
        ...app,
        subscriberCount: Number(subscriberCount?.count || 0),
        productCount: Number(productCount?.count || 0),
        webhookStats,
      };
    }),

  // Create new app
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "App name is required"),
        bundleId: z.string().optional(),
        packageName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits
      const canCreate = await canCreateApp(ctx.organizationId);
      if (!canCreate.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: canCreate.error?.message || "App limit reached. Please upgrade your plan.",
        });
      }

      const newApp = await createApp({
        organizationId: ctx.organizationId,
        name: input.name,
        bundleId: input.bundleId,
        packageName: input.packageName,
      });

      return newApp;
    }),

  // Update app
  update: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        name: z.string().min(1).optional(),
        bundleId: z.string().nullable().optional(),
        packageName: z.string().nullable().optional(),
        appleTeamId: z.string().nullable().optional(),
        appleKeyId: z.string().nullable().optional(),
        appleIssuerId: z.string().nullable().optional(),
        appleVendorNumber: z.string().nullable().optional(),
        applePrivateKey: z.string().nullable().optional(),
        appleSharedSecret: z.string().nullable().optional(),
        googleServiceAccount: z.string().nullable().optional(),
        webhookUrl: z.string().url().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const { appId, ...updates } = input;
      const updatedApp = await updateApp(appId, updates);

      return updatedApp;
    }),

  // Delete app
  delete: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      await deleteApp(input.appId);
      return { success: true };
    }),

  // Rotate API keys
  rotateKeys: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const keys = await regenerateApiKeys(input.appId);
      return keys;
    }),

  // Configure webhook
  configureWebhook: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        webhookUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const webhookSecret = await configureWebhook(
        input.appId,
        input.webhookUrl
      );
      return { webhookSecret };
    }),

  // Regenerate webhook ID for Apple or Google
  regenerateWebhookId: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        platform: z.enum(["apple", "google"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const result = await regenerateWebhookIds(input.appId, input.platform);
      return result;
    }),

  // Get integration test status
  getIntegrationTestStatus: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return {
        lastIntegrationTest: app.lastIntegrationTest?.toISOString() || null,
        lastIntegrationTestPlatform: app.lastIntegrationTestPlatform || null,
        lastIntegrationTestVersion: app.lastIntegrationTestVersion || null,
        hasBeenTested: !!app.lastIntegrationTest,
      };
    }),

  // ============================================================================
  // OUTBOUND WEBHOOK ENDPOINTS
  // ============================================================================

  // Get outbound webhook configuration
  getWebhookConfig: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return {
        webhookUrl: app.webhookUrl,
        hasWebhookSecret: !!app.webhookSecret,
        isConfigured: !!app.webhookUrl,
      };
    }),

  // Disable outbound webhook
  disableWebhook: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      await updateApp(input.appId, { webhookUrl: null });
      return { success: true };
    }),

  // Rotate webhook secret
  rotateWebhookSecret: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      if (!app.webhookUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No webhook URL configured",
        });
      }

      const webhookSecret = await configureWebhook(input.appId, app.webhookUrl);
      return { webhookSecret };
    }),

  // Get webhook deliveries
  getWebhookDeliveries: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        status: z.enum(["pending", "success", "failed"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const deliveries = await getWebhookDeliveries(input.appId, {
        limit: input.limit,
        status: input.status,
      });

      return deliveries.map((d) => ({
        id: d.id,
        eventId: d.eventId,
        eventType: d.eventType,
        appUserId: d.appUserId,
        webhookUrl: d.webhookUrl,
        status: d.status,
        statusCode: d.statusCode,
        errorMessage: d.errorMessage,
        duration: d.duration,
        attemptCount: d.attemptCount,
        createdAt: d.createdAt.toISOString(),
        deliveredAt: d.deliveredAt?.toISOString() || null,
      }));
    }),

  // Get webhook delivery stats
  getWebhookDeliveryStats: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return await getWebhookDeliveryStats(input.appId);
    }),

  // Retry failed webhook delivery
  retryWebhookDelivery: protectedProcedure
    .input(z.object({ deliveryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the delivery to check ownership
      const [delivery] = await db
        .select()
        .from(webhookDelivery)
        .where(eq(webhookDelivery.id, input.deliveryId))
        .limit(1);

      if (!delivery) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Delivery not found",
        });
      }

      // Check app ownership
      const app = await getApp(delivery.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Delivery not found" });
      }

      const result = await retryWebhookDelivery(input.deliveryId);

      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not retry delivery",
        });
      }

      return {
        success: result.success,
        statusCode: result.statusCode,
        duration: result.duration,
        error: result.error,
      };
    }),

  // Send test webhook
  sendTestWebhook: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);

      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      if (!app.webhookUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No webhook URL configured",
        });
      }

      const result = await sendCustomerWebhook(input.appId, "TEST", {
        subscriber_info: {
          id: "test_subscriber_123",
          app_user_id: "test_user_123",
          original_app_user_id: null,
          aliases: [],
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          attributes: {},
        },
        entitlements: [],
        platform: "ios",
        environment: "sandbox",
        is_test: true,
        message: "This is a test webhook from CroissantPay",
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send test webhook",
        });
      }

      return {
        success: result.success,
        statusCode: result.statusCode,
        duration: result.duration,
        error: result.error,
        responseBody: result.responseBody?.substring(0, 500),
      };
    }),
});

