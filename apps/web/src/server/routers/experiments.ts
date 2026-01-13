import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  createExperiment,
  getExperiment,
  getExperimentsByApp,
  updateExperiment,
  deleteExperiment,
  createVariant,
  updateVariant,
  deleteVariant,
  getExperimentResults,
  startExperiment,
  pauseExperiment,
  completeExperiment,
} from "@/lib/services/experiments";
import { getApp, getAppsByOrganization } from "@/lib/services/apps";
import { db } from "@/lib/db";
import { experiment } from "@/lib/db/schema";
import { inArray, desc } from "drizzle-orm";

export const experimentsRouter = createTRPCRouter({
  // List all experiments for organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);

    const experiments = await db
      .select()
      .from(experiment)
      .where(inArray(experiment.appId, appIds))
      .orderBy(desc(experiment.createdAt));

    return experiments;
  }),

  // List experiments by app
  listByApp: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getExperimentsByApp(input.appId);
    }),

  // Get single experiment with variants
  get: protectedProcedure
    .input(z.object({ experimentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return exp;
    }),

  // Get experiment results
  getResults: protectedProcedure
    .input(z.object({ experimentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return getExperimentResults(input.experimentId);
    }),

  // Create experiment
  create: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        hypothesis: z.string().optional(),
        primaryMetric: z.string().optional(),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return createExperiment(input);
    }),

  // Update experiment
  update: protectedProcedure
    .input(
      z.object({
        experimentId: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        hypothesis: z.string().optional(),
        primaryMetric: z.string().optional(),
        trafficAllocation: z.number().min(1).max(100).optional(),
        targetAudience: z
          .object({
            platforms: z.array(z.enum(["ios", "android"])).optional(),
            countries: z.array(z.string()).optional(),
            appVersions: z.array(z.string()).optional(),
            userAttributes: z.record(z.unknown()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const { experimentId, ...updates } = input;
      return updateExperiment(experimentId, updates);
    }),

  // Delete experiment
  delete: protectedProcedure
    .input(z.object({ experimentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      await deleteExperiment(input.experimentId);
      return { success: true };
    }),

  // Start experiment
  start: protectedProcedure
    .input(z.object({ experimentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return startExperiment(input.experimentId);
    }),

  // Pause experiment
  pause: protectedProcedure
    .input(z.object({ experimentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return pauseExperiment(input.experimentId);
    }),

  // Complete experiment
  complete: protectedProcedure
    .input(
      z.object({
        experimentId: z.string().uuid(),
        winningVariantId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return completeExperiment(input.experimentId, input.winningVariantId);
    }),

  // =====================
  // VARIANTS
  // =====================

  // Create variant
  createVariant: protectedProcedure
    .input(
      z.object({
        experimentId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        isControl: z.boolean().default(false),
        weight: z.number().min(1).default(1),
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
    .mutation(async ({ ctx, input }) => {
      const exp = await getExperiment(input.experimentId);
      if (!exp) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      const app = await getApp(exp.experiment.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Experiment not found",
        });
      }

      return createVariant(input);
    }),

  // Update variant
  updateVariant: protectedProcedure
    .input(
      z.object({
        variantId: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isControl: z.boolean().optional(),
        weight: z.number().min(1).optional(),
        offeringId: z.string().uuid().optional(),
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
    .mutation(async ({ ctx, input }) => {
      const { variantId, ...updates } = input;
      return updateVariant(variantId, updates);
    }),

  // Delete variant
  deleteVariant: protectedProcedure
    .input(z.object({ variantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await deleteVariant(input.variantId);
      return { success: true };
    }),
});

