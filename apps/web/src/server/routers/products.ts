import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  createProduct,
  getProduct,
  getProductsByApp,
  updateProduct,
  deleteProduct,
  createEntitlement,
  getEntitlement,
  getEntitlementsByApp,
  updateEntitlement,
  deleteEntitlement,
  linkProductToEntitlements,
  getProductEntitlements,
  createOffering,
  getOffering,
  getOfferingsByApp,
  updateOffering,
  deleteOffering,
  setOfferingProducts,
  getOfferingProducts,
} from "@/lib/services/products";
import { getAppsByOrganization, getApp } from "@/lib/services/apps";
import { db } from "@/lib/db";
import { product, entitlement, offering } from "@/lib/db/schema";
import { inArray, desc, eq } from "drizzle-orm";

const productTypeEnum = z.enum([
  "consumable",
  "non_consumable",
  "auto_renewable_subscription",
  "non_renewing_subscription",
]);

export const productsRouter = createTRPCRouter({
  // =====================
  // PRODUCTS
  // =====================

  // List all products for organization (with app info)
  list: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);
    const appMap = new Map(apps.map((a) => [a.id, a]));

    const products = await db
      .select()
      .from(product)
      .where(inArray(product.appId, appIds))
      .orderBy(desc(product.createdAt));

    // Add app info to each product
    return products.map((p) => ({
      ...p,
      app: appMap.get(p.appId) || null,
    }));
  }),

  // Get products for specific app
  listByApp: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getProductsByApp(input.appId);
    }),

  // Get single product
  get: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const prod = await getProduct(input.productId);
      if (!prod) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Verify ownership
      const app = await getApp(prod.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const entitlements = await getProductEntitlements(input.productId);

      return { ...prod, entitlements };
    }),

  // Create product
  create: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        identifier: z.string().min(1),
        storeProductId: z.string().min(1),
        platform: z.enum(["ios", "android"]),
        type: productTypeEnum,
        displayName: z.string().min(1),
        description: z.string().optional(),
        subscriptionGroupId: z.string().optional(),
        trialDuration: z.string().optional(),
        subscriptionPeriod: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify app ownership
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return createProduct(input);
    }),

  // Update product
  update: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        identifier: z.string().min(1).optional(),
        storeProductId: z.string().min(1).optional(),
        type: productTypeEnum.optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        subscriptionGroupId: z.string().optional(),
        trialDuration: z.string().optional(),
        subscriptionPeriod: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prod = await getProduct(input.productId);
      if (!prod) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const app = await getApp(prod.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const { productId, ...updates } = input;
      return updateProduct(productId, updates);
    }),

  // Delete product
  delete: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const prod = await getProduct(input.productId);
      if (!prod) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const app = await getApp(prod.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await deleteProduct(input.productId);
      return { success: true };
    }),

  // Link product to entitlements
  linkEntitlements: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        entitlementIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prod = await getProduct(input.productId);
      if (!prod) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const app = await getApp(prod.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await linkProductToEntitlements(input.productId, input.entitlementIds);
      return { success: true };
    }),

  // =====================
  // ENTITLEMENTS
  // =====================

  // List entitlements for organization (with app info)
  listEntitlements: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);
    const appMap = new Map(apps.map((a) => [a.id, a]));

    const entitlements = await db
      .select()
      .from(entitlement)
      .where(inArray(entitlement.appId, appIds))
      .orderBy(desc(entitlement.createdAt));

    return entitlements.map((e) => ({
      ...e,
      app: appMap.get(e.appId) || null,
    }));
  }),

  // List entitlements by app
  listEntitlementsByApp: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getEntitlementsByApp(input.appId);
    }),

  // Create entitlement
  createEntitlement: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        identifier: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return createEntitlement(input);
    }),

  // Update entitlement
  updateEntitlement: protectedProcedure
    .input(
      z.object({
        entitlementId: z.string().uuid(),
        identifier: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ent = await getEntitlement(input.entitlementId);
      if (!ent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entitlement not found",
        });
      }

      const app = await getApp(ent.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entitlement not found",
        });
      }

      const { entitlementId, ...updates } = input;
      return updateEntitlement(entitlementId, updates);
    }),

  // Delete entitlement
  deleteEntitlement: protectedProcedure
    .input(z.object({ entitlementId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ent = await getEntitlement(input.entitlementId);
      if (!ent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entitlement not found",
        });
      }

      const app = await getApp(ent.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Entitlement not found",
        });
      }

      await deleteEntitlement(input.entitlementId);
      return { success: true };
    }),

  // =====================
  // OFFERINGS
  // =====================

  // List offerings for organization (with app info)
  listOfferings: protectedProcedure.query(async ({ ctx }) => {
    const apps = await getAppsByOrganization(ctx.organizationId);

    if (apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);
    const appMap = new Map(apps.map((a) => [a.id, a]));

    const offerings = await db
      .select()
      .from(offering)
      .where(inArray(offering.appId, appIds))
      .orderBy(desc(offering.createdAt));

    return offerings.map((o) => ({
      ...o,
      app: appMap.get(o.appId) || null,
    }));
  }),

  // List offerings by app
  listOfferingsByApp: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return getOfferingsByApp(input.appId);
    }),

  // Get offering with products
  getOffering: protectedProcedure
    .input(z.object({ offeringId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const off = await getOffering(input.offeringId);
      if (!off) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const app = await getApp(off.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const products = await getOfferingProducts(input.offeringId);

      return { ...off, products };
    }),

  // Create offering
  createOffering: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        identifier: z.string().min(1),
        displayName: z.string().min(1),
        description: z.string().optional(),
        isCurrent: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      return createOffering(input);
    }),

  // Update offering
  updateOffering: protectedProcedure
    .input(
      z.object({
        offeringId: z.string().uuid(),
        identifier: z.string().min(1).optional(),
        displayName: z.string().min(1).optional(),
        description: z.string().optional(),
        isCurrent: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const off = await getOffering(input.offeringId);
      if (!off) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const app = await getApp(off.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const { offeringId, ...updates } = input;
      return updateOffering(offeringId, updates);
    }),

  // Delete offering
  deleteOffering: protectedProcedure
    .input(z.object({ offeringId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const off = await getOffering(input.offeringId);
      if (!off) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const app = await getApp(off.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      await deleteOffering(input.offeringId);
      return { success: true };
    }),

  // Set offering products
  setOfferingProducts: protectedProcedure
    .input(
      z.object({
        offeringId: z.string().uuid(),
        productIds: z.array(z.string().uuid()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const off = await getOffering(input.offeringId);
      if (!off) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      const app = await getApp(off.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offering not found" });
      }

      await setOfferingProducts(input.offeringId, input.productIds);
      return { success: true };
    }),
});

