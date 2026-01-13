// Main SDK export
export { CroissantPay } from "./CroissantPay";

// React hooks
export { CroissantPayProvider, usePurchases, useCroissantPay } from "./hooks";

// Types
export type {
  // Config
  CroissantPayConfig,
  // Entitlements
  Entitlement,
  EntitlementMap,
  // Subscriber
  SubscriberInfo,
  NonSubscriptionPurchase,
  // Products
  Product,
  ProductType,
  Platform,
  IntroPrice,
  // Offerings
  Package,
  PackageType,
  Offering,
  Offerings,
  // Purchase
  PurchaseResult,
  RestoreResult,
  // Errors
  PurchaseError,
  PurchaseErrorCode,
  // Native
  NativeTransaction,
  NativeProduct,
  NativeCroissantPayModule,
} from "./types";

// Error class
export { CroissantPayError } from "./types";

// Helpers
export {
  isSubscription,
  isConsumable,
  getBestPackage,
  formatPeriod,
} from "./types";

// Webhook verification (for server-side use)
export {
  verifyWebhookSignature,
  computeSignature,
  constructEvent,
  WebhookEventTypes,
} from "./webhooks";

export type { WebhookEvent, WebhookEventType } from "./webhooks";
