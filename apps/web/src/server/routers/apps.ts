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
} from "@/lib/services/apps";
import { getWebhookStats } from "@/lib/services/webhooks";
import { canCreateApp } from "@/lib/api/plan-limits";
import { db } from "@/lib/db";
import { subscriber, subscription, product } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

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
});

