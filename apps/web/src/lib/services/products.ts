import { db } from "@/lib/db";
import {
  product,
  entitlement,
  productEntitlement,
  offering,
  offeringProduct,
} from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface CreateProductInput {
  appId: string;
  identifier: string;
  storeProductId: string;
  platform: "ios" | "android";
  type: "consumable" | "non_consumable" | "auto_renewable_subscription" | "non_renewing_subscription";
  displayName: string;
  description?: string;
  subscriptionGroupId?: string;
  trialDuration?: string;
  subscriptionPeriod?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEntitlementInput {
  appId: string;
  identifier: string;
  displayName: string;
  description?: string;
}

export interface CreateOfferingInput {
  appId: string;
  identifier: string;
  displayName: string;
  description?: string;
  isCurrent?: boolean;
  metadata?: Record<string, unknown>;
}

// Products
export async function createProduct(
  input: CreateProductInput
): Promise<typeof product.$inferSelect> {
  const [newProduct] = await db
    .insert(product)
    .values(input)
    .returning();

  return newProduct;
}

export async function getProduct(
  productId: string
): Promise<typeof product.$inferSelect | null> {
  const [found] = await db
    .select()
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);

  return found || null;
}

export async function getProductsByApp(
  appId: string
): Promise<Array<typeof product.$inferSelect>> {
  return db
    .select()
    .from(product)
    .where(eq(product.appId, appId));
}

export async function updateProduct(
  productId: string,
  input: Partial<CreateProductInput>
): Promise<typeof product.$inferSelect> {
  const [updated] = await db
    .update(product)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(product.id, productId))
    .returning();

  return updated;
}

export async function deleteProduct(productId: string): Promise<void> {
  await db.delete(product).where(eq(product.id, productId));
}

// Entitlements
export async function createEntitlement(
  input: CreateEntitlementInput
): Promise<typeof entitlement.$inferSelect> {
  const [newEntitlement] = await db
    .insert(entitlement)
    .values(input)
    .returning();

  return newEntitlement;
}

export async function getEntitlement(
  entitlementId: string
): Promise<typeof entitlement.$inferSelect | null> {
  const [found] = await db
    .select()
    .from(entitlement)
    .where(eq(entitlement.id, entitlementId))
    .limit(1);

  return found || null;
}

export async function getEntitlementsByApp(
  appId: string
): Promise<Array<typeof entitlement.$inferSelect>> {
  return db
    .select()
    .from(entitlement)
    .where(eq(entitlement.appId, appId));
}

export async function updateEntitlement(
  entitlementId: string,
  input: Partial<CreateEntitlementInput>
): Promise<typeof entitlement.$inferSelect> {
  const [updated] = await db
    .update(entitlement)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(entitlement.id, entitlementId))
    .returning();

  return updated;
}

export async function deleteEntitlement(entitlementId: string): Promise<void> {
  await db.delete(entitlement).where(eq(entitlement.id, entitlementId));
}

// Product-Entitlement linking
export async function linkProductToEntitlements(
  productId: string,
  entitlementIds: string[]
): Promise<void> {
  // Remove existing links
  await db
    .delete(productEntitlement)
    .where(eq(productEntitlement.productId, productId));

  // Add new links
  if (entitlementIds.length > 0) {
    await db.insert(productEntitlement).values(
      entitlementIds.map((entitlementId) => ({
        productId,
        entitlementId,
      }))
    );
  }
}

export async function getProductEntitlements(
  productId: string
): Promise<Array<typeof entitlement.$inferSelect>> {
  const links = await db
    .select({ entitlement })
    .from(productEntitlement)
    .innerJoin(entitlement, eq(productEntitlement.entitlementId, entitlement.id))
    .where(eq(productEntitlement.productId, productId));

  return links.map((l) => l.entitlement);
}

// Offerings
export async function createOffering(
  input: CreateOfferingInput
): Promise<typeof offering.$inferSelect> {
  // If this is the current offering, unset others
  if (input.isCurrent) {
    await db
      .update(offering)
      .set({ isCurrent: false })
      .where(eq(offering.appId, input.appId));
  }

  const [newOffering] = await db
    .insert(offering)
    .values(input)
    .returning();

  return newOffering;
}

export async function getOffering(
  offeringId: string
): Promise<typeof offering.$inferSelect | null> {
  const [found] = await db
    .select()
    .from(offering)
    .where(eq(offering.id, offeringId))
    .limit(1);

  return found || null;
}

export async function getOfferingsByApp(
  appId: string
): Promise<Array<typeof offering.$inferSelect>> {
  return db
    .select()
    .from(offering)
    .where(eq(offering.appId, appId));
}

export async function updateOffering(
  offeringId: string,
  input: Partial<CreateOfferingInput>
): Promise<typeof offering.$inferSelect> {
  // Get the offering to check app ID
  const existing = await getOffering(offeringId);
  if (!existing) {
    throw new Error("Offering not found");
  }

  // If setting as current, unset others
  if (input.isCurrent) {
    await db
      .update(offering)
      .set({ isCurrent: false })
      .where(eq(offering.appId, existing.appId));
  }

  const [updated] = await db
    .update(offering)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(offering.id, offeringId))
    .returning();

  return updated;
}

export async function deleteOffering(offeringId: string): Promise<void> {
  await db.delete(offering).where(eq(offering.id, offeringId));
}

// Offering-Product linking
export async function setOfferingProducts(
  offeringId: string,
  productIds: string[]
): Promise<void> {
  // Remove existing links
  await db
    .delete(offeringProduct)
    .where(eq(offeringProduct.offeringId, offeringId));

  // Add new links with positions
  if (productIds.length > 0) {
    await db.insert(offeringProduct).values(
      productIds.map((productId, index) => ({
        offeringId,
        productId,
        position: index,
      }))
    );
  }
}

export async function getOfferingProducts(
  offeringId: string
): Promise<Array<typeof product.$inferSelect>> {
  const links = await db
    .select({ product, position: offeringProduct.position })
    .from(offeringProduct)
    .innerJoin(product, eq(offeringProduct.productId, product.id))
    .where(eq(offeringProduct.offeringId, offeringId))
    .orderBy(offeringProduct.position);

  return links.map((l) => l.product);
}

// =====================
// BULK IMPORT
// =====================

export interface BulkImportProductInput {
  appId: string;
  identifier: string;
  storeProductId: string;
  platform: "ios" | "android";
  type: "consumable" | "non_consumable" | "auto_renewable_subscription" | "non_renewing_subscription";
  displayName: string;
  description?: string;
  subscriptionGroupId?: string;
  trialDuration?: string;
  subscriptionPeriod?: string;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ storeProductId: string; error: string }>;
}

export async function bulkImportProducts(
  products: BulkImportProductInput[],
  updateExisting: boolean = false
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const p of products) {
    try {
      // Check if product already exists
      const [existing] = await db
        .select()
        .from(product)
        .where(
          and(
            eq(product.appId, p.appId),
            eq(product.storeProductId, p.storeProductId),
            eq(product.platform, p.platform)
          )
        )
        .limit(1);

      if (existing) {
        if (updateExisting) {
          // Update existing product
          await db
            .update(product)
            .set({
              identifier: p.identifier,
              displayName: p.displayName,
              description: p.description,
              type: p.type,
              subscriptionGroupId: p.subscriptionGroupId,
              trialDuration: p.trialDuration,
              subscriptionPeriod: p.subscriptionPeriod,
              updatedAt: new Date(),
            })
            .where(eq(product.id, existing.id));
          result.updated++;
        } else {
          result.skipped++;
        }
      } else {
        // Create new product
        await db.insert(product).values({
          appId: p.appId,
          identifier: p.identifier,
          storeProductId: p.storeProductId,
          platform: p.platform,
          type: p.type,
          displayName: p.displayName,
          description: p.description,
          subscriptionGroupId: p.subscriptionGroupId,
          trialDuration: p.trialDuration,
          subscriptionPeriod: p.subscriptionPeriod,
        });
        result.created++;
      }
    } catch (error) {
      result.errors.push({
        storeProductId: p.storeProductId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return result;
}
