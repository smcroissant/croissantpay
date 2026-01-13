import { z } from "zod";

// Receipt validation schemas
export const validateReceiptSchema = z.object({
  appUserId: z.string().min(1, "App user ID is required"),
  platform: z.enum(["ios", "android"]),
  // iOS: base64 encoded receipt or transaction ID
  // Android: purchase token
  receiptData: z.string().min(1, "Receipt data is required"),
  productId: z.string().optional(),
  // For iOS StoreKit 2 transactions
  transactionId: z.string().optional(),
  // For Android
  subscriptionId: z.string().optional(),
});

export type ValidateReceiptInput = z.infer<typeof validateReceiptSchema>;

// Subscriber schemas
export const getSubscriberSchema = z.object({
  appUserId: z.string().min(1),
});

export const updateAttributesSchema = z.object({
  attributes: z.record(z.unknown()),
});

// Product schemas
export const createProductSchema = z.object({
  identifier: z.string().min(1),
  storeProductId: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  type: z.enum([
    "consumable",
    "non_consumable",
    "auto_renewable_subscription",
    "non_renewing_subscription",
  ]),
  displayName: z.string().min(1),
  description: z.string().optional(),
  subscriptionGroupId: z.string().optional(),
  trialDuration: z.string().optional(),
  subscriptionPeriod: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Entitlement schemas
export const createEntitlementSchema = z.object({
  identifier: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});

export type CreateEntitlementInput = z.infer<typeof createEntitlementSchema>;

// Offering schemas
export const createOfferingSchema = z.object({
  identifier: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  isCurrent: z.boolean().optional(),
  productIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateOfferingInput = z.infer<typeof createOfferingSchema>;

// Grant entitlement (manual)
export const grantEntitlementSchema = z.object({
  appUserId: z.string().min(1),
  entitlementIdentifier: z.string().min(1),
  expiresDate: z.string().datetime().optional(),
  reason: z.string().optional(),
});

export type GrantEntitlementInput = z.infer<typeof grantEntitlementSchema>;

// Revoke entitlement (manual)
export const revokeEntitlementSchema = z.object({
  appUserId: z.string().min(1),
  entitlementIdentifier: z.string().min(1),
});

export type RevokeEntitlementInput = z.infer<typeof revokeEntitlementSchema>;

