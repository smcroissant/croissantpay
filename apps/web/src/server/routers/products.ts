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
  bulkImportProducts,
  type BulkImportProductInput,
} from "@/lib/services/products";
import { getAppsByOrganization, getApp } from "@/lib/services/apps";
import { createAppStoreConnectClient } from "@/lib/services/app-store-connect";
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

  // Get single entitlement
  getEntitlement: protectedProcedure
    .input(z.object({ entitlementId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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

      return ent;
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

  // Get offering products separately
  getOfferingProducts: protectedProcedure
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

      return getOfferingProducts(input.offeringId);
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

  // =====================
  // BULK IMPORT (App Store Connect / Google Play)
  // =====================

  // Import products from App Store Connect CSV export
  importFromAppStore: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        products: z.array(
          z.object({
            storeProductId: z.string().min(1),
            displayName: z.string().min(1),
            type: productTypeEnum,
            subscriptionPeriod: z.string().optional(),
            trialDuration: z.string().optional(),
            subscriptionGroupId: z.string().optional(),
          })
        ),
        updateExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify app ownership
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const productsToImport: BulkImportProductInput[] = input.products.map(
        (p) => ({
          appId: input.appId,
          identifier: p.storeProductId.replace(/\./g, "_"), // Create identifier from store ID
          storeProductId: p.storeProductId,
          platform: "ios" as const,
          type: p.type,
          displayName: p.displayName,
          subscriptionPeriod: p.subscriptionPeriod,
          trialDuration: p.trialDuration,
          subscriptionGroupId: p.subscriptionGroupId,
        })
      );

      const result = await bulkImportProducts(
        productsToImport,
        input.updateExisting
      );

      return result;
    }),

  // Import products from Google Play Console CSV export
  importFromPlayStore: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        products: z.array(
          z.object({
            storeProductId: z.string().min(1),
            displayName: z.string().min(1),
            type: productTypeEnum,
            subscriptionPeriod: z.string().optional(),
            trialDuration: z.string().optional(),
          })
        ),
        updateExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify app ownership
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const productsToImport: BulkImportProductInput[] = input.products.map(
        (p) => ({
          appId: input.appId,
          identifier: p.storeProductId,
          storeProductId: p.storeProductId,
          platform: "android" as const,
          type: p.type,
          displayName: p.displayName,
          subscriptionPeriod: p.subscriptionPeriod,
          trialDuration: p.trialDuration,
        })
      );

      const result = await bulkImportProducts(
        productsToImport,
        input.updateExisting
      );

      return result;
    }),

  // =====================
  // SYNC FROM STORE APIs
  // =====================

  // Sync products directly from App Store Connect API
  syncFromAppStore: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        updateExisting: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify app ownership
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      // Check if App Store Connect is configured
      if (!app.applePrivateKey || !app.appleKeyId || !app.appleIssuerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "App Store Connect API is not configured. Please add your API credentials in the app settings.",
        });
      }

      if (!app.bundleId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bundle ID is required for syncing products from App Store Connect. Please add it in the app settings.",
        });
      }

      try {
        // Create App Store Connect client and fetch products
        const client = createAppStoreConnectClient(app);
        const fetchedProducts = await client.fetchAllProducts();

        if (fetchedProducts.length === 0) {
          return {
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            message: "No products found in App Store Connect for this app.",
          };
        }

        // Convert to bulk import format
        const productsToImport: BulkImportProductInput[] = fetchedProducts.map(
          (p) => ({
            appId: input.appId,
            identifier: p.storeProductId.replace(/\./g, "_"),
            storeProductId: p.storeProductId,
            platform: "ios" as const,
            type: p.type,
            displayName: p.displayName,
            subscriptionPeriod: p.subscriptionPeriod,
            subscriptionGroupId: p.subscriptionGroupId,
          })
        );

        const result = await bulkImportProducts(
          productsToImport,
          input.updateExisting
        );

        return {
          ...result,
          message: `Successfully synced ${result.created + result.updated} products from App Store Connect.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error 
            ? `Failed to sync from App Store Connect: ${error.message}`
            : "Failed to sync from App Store Connect",
        });
      }
    }),

  // Check if App Store Connect sync is available for an app
  checkAppStoreConnectStatus: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      const isConfigured = !!(
        app.applePrivateKey &&
        app.appleKeyId &&
        app.appleIssuerId &&
        app.bundleId
      );

      const missingFields: string[] = [];
      if (!app.applePrivateKey) missingFields.push("Private Key (.p8)");
      if (!app.appleKeyId) missingFields.push("Key ID");
      if (!app.appleIssuerId) missingFields.push("Issuer ID");
      if (!app.bundleId) missingFields.push("Bundle ID");

      return {
        isConfigured,
        missingFields,
        bundleId: app.bundleId,
      };
    }),

  // Test App Store Connect connection
  testAppStoreConnection: protectedProcedure
    .input(z.object({ appId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const app = await getApp(input.appId);
      if (!app || app.organizationId !== ctx.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }

      // Check if credentials are configured
      if (!app.applePrivateKey || !app.appleKeyId || !app.appleIssuerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "App Store Connect API credentials are not fully configured.",
        });
      }

      if (!app.bundleId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bundle ID is required to test the connection.",
        });
      }

      try {
        const client = createAppStoreConnectClient(app);
        
        // Try to fetch apps - this will validate the credentials
        const apps = await client.getApps();
        
        // Find the app with matching bundle ID
        const matchingApp = apps.find((a) => a.bundleId === app.bundleId);
        
        if (!matchingApp) {
          return {
            success: true,
            connected: true,
            appFound: false,
            message: `Connected to App Store Connect successfully, but no app found with bundle ID "${app.bundleId}". Found ${apps.length} app(s): ${apps.map(a => a.bundleId).join(", ")}`,
            availableApps: apps,
          };
        }

        return {
          success: true,
          connected: true,
          appFound: true,
          message: `Successfully connected to App Store Connect! Found app "${matchingApp.name}" with bundle ID "${matchingApp.bundleId}".`,
          appName: matchingApp.name,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to connect to App Store Connect",
        });
      }
    }),
});

