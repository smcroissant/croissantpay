import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  createPromoCode,
  getPromoCode,
  getPromoCodesByApp,
  updatePromoCode,
  deletePromoCode,
  bulkCreatePromoCodes,
} from "@/lib/services/promo-codes";
import { getApp, getAppsByOrganization } from "@/lib/services/apps";
import { db } from "@/lib/db";
import { promoCode } from "@/lib/db/schema";
import { inArray, desc } from "drizzle-orm";

const promoCodeTypeEnum = z.enum([
  "percentage_discount",
  "fixed_discount",
  "free_trial_extension",
  "free_subscription",
]);

export const promoCodesRouter = createTRPCRouter({
  // List all promo codes for organization
  list: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);

    const promoCodes = await db
      .select()
      .from(promoCode)
      .where(inArray(promoCode.appId, appIds))
      .orderBy(desc(promoCode.createdAt));

    return promoCodes;
  }),

  // List promo codes by app
  listByApp: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getPromoCodesByApp(input.appId);
    }),

  // Get single promo code
  get: protectedProcedure
    .input(z.object({ promoCodeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const code = await getPromoCode(input.promoCodeId);
      if (!code) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      const app = await getApp(code.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      return code;
    }),

  // Create promo code
  create: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        code: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        type: promoCodeTypeEnum,
        discountPercent: z.number().min(1).max(100).optional(),
        discountAmount: z.number().min(1).optional(),
        freeTrialDays: z.number().min(1).optional(),
        freePeriod: z.string().optional(),
        productIds: z.array(z.string().uuid()).optional(),
        entitlementIds: z.array(z.string().uuid()).optional(),
        maxRedemptions: z.number().min(1).optional(),
        maxRedemptionsPerUser: z.number().min(1).default(1),
        startsAt: z.date().optional(),
        expiresAt: z.date().optional(),
        bulkCount: z.number().min(1).max(1000).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const { bulkCount, ...promoData } = input;

      if (bulkCount > 1) {
        // Bulk create
        const codes = await bulkCreatePromoCodes(promoData, bulkCount);
        return { codes, count: codes.length };
      }

      // Single create
      const code = await createPromoCode(promoData);
      return { codes: [code], count: 1 };
    }),

  // Update promo code
  update: protectedProcedure
    .input(
      z.object({
        promoCodeId: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        maxRedemptions: z.number().min(1).optional(),
        maxRedemptionsPerUser: z.number().min(1).optional(),
        expiresAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = await getPromoCode(input.promoCodeId);
      if (!code) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      const app = await getApp(code.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      const { promoCodeId, ...updates } = input;
      return updatePromoCode(promoCodeId, updates);
    }),

  // Delete promo code
  delete: protectedProcedure
    .input(z.object({ promoCodeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const code = await getPromoCode(input.promoCodeId);
      if (!code) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      const app = await getApp(code.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Promo code not found",
        });
      }

      await deletePromoCode(input.promoCodeId);
      return { success: true };
    }),
});

