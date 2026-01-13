// =============================================================================
// CONFIGURATION
// =============================================================================

export interface CroissantPayConfig {
  /** Your CroissantPay public API key (starts with mx_public_) */
  apiKey: string;
  /** API URL - defaults to https://api.croissantpay.dev for cloud, or your self-hosted URL */
  apiUrl?: string;
  /** Your app's user ID for this subscriber */
  appUserId?: string;
  /** Enable debug logging */
  debugLogs?: boolean;
  /** Timeout for API requests in milliseconds (default: 10000) */
  requestTimeout?: number;
  /** Retry failed requests (default: true) */
  enableRetry?: boolean;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
}

// =============================================================================
// ENTITLEMENTS
// =============================================================================

export interface Entitlement {
  /** Unique identifier for this entitlement */
  identifier: string;
  /** Whether the entitlement is currently active */
  isActive: boolean;
  /** When this entitlement expires (null if non-expiring) */
  expiresDate: Date | null;
  /** The product that granted this entitlement */
  productIdentifier: string | null;
  /** When the entitlement was first purchased */
  purchaseDate: Date | null;
  /** Whether the subscription will auto-renew */
  willRenew: boolean;
  /** The current period type */
  periodType: "normal" | "trial" | "intro";
  /** Most recent purchase/renewal date */
  latestPurchaseDate: Date | null;
  /** Original purchase date */
  originalPurchaseDate: Date | null;
  /** Whether this was purchased in sandbox environment */
  isSandbox: boolean;
  /** Ownership type for family sharing (iOS) */
  ownershipType?: "purchased" | "family_shared";
}

export type EntitlementMap = Record<string, Entitlement>;

// =============================================================================
// SUBSCRIBER
// =============================================================================

export interface SubscriberInfo {
  /** The subscriber's ID in your system */
  appUserId: string;
  /** Original user ID (before any alias changes) */
  originalAppUserId: string | null;
  /** Alternative user IDs linked to this subscriber */
  aliases: string[];
  /** Custom attributes for this subscriber */
  attributes: Record<string, unknown>;
  /** When this subscriber was first seen */
  firstSeenAt: Date;
  /** When this subscriber was last seen */
  lastSeenAt: Date;
  /** Active entitlements keyed by identifier */
  entitlements: EntitlementMap;
  /** List of active subscription product identifiers */
  activeSubscriptions: string[];
  /** List of non-subscription purchases */
  nonSubscriptionPurchases: NonSubscriptionPurchase[];
  /** Management URL for the subscriber (if available) */
  managementUrl?: string;
}

export interface NonSubscriptionPurchase {
  productIdentifier: string;
  purchaseDate: Date;
  transactionId: string;
  storeTransactionId: string;
  isSandbox: boolean;
}

// =============================================================================
// PRODUCTS
// =============================================================================

export type ProductType =
  | "consumable"
  | "non_consumable"
  | "auto_renewable_subscription"
  | "non_renewing_subscription";

export type Platform = "ios" | "android";

export interface Product {
  /** Your internal product identifier */
  identifier: string;
  /** The product ID in the App Store or Play Store */
  storeProductId: string;
  /** Platform this product is for */
  platform: Platform;
  /** Type of product */
  type: ProductType;
  /** Display name from CroissantPay */
  displayName: string;
  /** Description from CroissantPay */
  description: string | null;
  /** Subscription period in ISO 8601 duration (P1M, P1Y, etc.) */
  subscriptionPeriod: string | null;
  /** Trial duration in ISO 8601 duration */
  trialDuration: string | null;
  /** Entitlements granted by this product */
  entitlements: string[];
  // Store-specific product info (populated from native module)
  /** Formatted price string (e.g., "$9.99") */
  priceString?: string;
  /** Numeric price */
  price?: number;
  /** Currency code (e.g., "USD") */
  currencyCode?: string;
  /** Price in micros (price * 1,000,000) */
  priceAmountMicros?: number;
  /** Introductory price info (if available) */
  introPrice?: IntroPrice;
  /** Subscription group (iOS) */
  subscriptionGroupIdentifier?: string;
}

export interface IntroPrice {
  priceString: string;
  price: number;
  period: string;
  periodCount: number;
  paymentMode: "pay_as_you_go" | "pay_up_front" | "free_trial";
}

// =============================================================================
// OFFERINGS
// =============================================================================

export interface Package {
  /** Package identifier (e.g., "$rc_monthly", "custom_id") */
  identifier: string;
  /** The product in this package */
  product: Product;
  /** Package type */
  packageType: PackageType;
}

export type PackageType =
  | "unknown"
  | "custom"
  | "lifetime"
  | "annual"
  | "six_month"
  | "three_month"
  | "two_month"
  | "monthly"
  | "weekly";

export interface Offering {
  /** Offering identifier */
  identifier: string;
  /** Display name */
  displayName: string;
  /** Description */
  description: string | null;
  /** Whether this is the current offering */
  isCurrent: boolean;
  /** Custom metadata */
  metadata: Record<string, unknown> | null;
  /** Products in this offering (deprecated, use packages) */
  products: Product[];
  /** Packages in this offering */
  packages: Package[];
  /** Lifetime package (if available) */
  lifetime?: Package;
  /** Annual package (if available) */
  annual?: Package;
  /** Six month package (if available) */
  sixMonth?: Package;
  /** Three month package (if available) */
  threeMonth?: Package;
  /** Two month package (if available) */
  twoMonth?: Package;
  /** Monthly package (if available) */
  monthly?: Package;
  /** Weekly package (if available) */
  weekly?: Package;
}

export interface Offerings {
  /** The current offering identifier */
  currentOfferingId: string | null;
  /** The current offering (shortcut) */
  current: Offering | null;
  /** All offerings keyed by identifier */
  offerings: Record<string, Offering>;
}

// =============================================================================
// PURCHASE
// =============================================================================

export interface PurchaseResult {
  /** Whether the purchase was successful */
  success: boolean;
  /** Updated subscriber info after purchase */
  subscriberInfo: SubscriberInfo;
  /** Store transaction ID */
  transactionId?: string;
  /** Product that was purchased */
  productIdentifier?: string;
  /** Error if purchase failed */
  error?: PurchaseError;
}

export interface RestoreResult {
  /** Whether restore was successful */
  success: boolean;
  /** Updated subscriber info after restore */
  subscriberInfo: SubscriberInfo;
  /** Number of transactions restored */
  restoredTransactions: number;
}

// =============================================================================
// ERRORS
// =============================================================================

export type PurchaseErrorCode =
  | "PURCHASE_CANCELLED"
  | "PURCHASE_PENDING"
  | "PRODUCT_NOT_FOUND"
  | "STORE_ERROR"
  | "STORE_PROBLEM"
  | "NETWORK_ERROR"
  | "NOT_CONFIGURED"
  | "ALREADY_PURCHASED"
  | "RECEIPT_VALIDATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "PAYMENT_PENDING"
  | "INSUFFICIENT_PERMISSIONS"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export interface PurchaseError {
  /** Error code */
  code: PurchaseErrorCode;
  /** Human-readable error message */
  message: string;
  /** Underlying platform error */
  underlyingError?: string;
  /** Whether this error is recoverable */
  userRecoverable?: boolean;
}

/** Custom error class for CroissantPay errors */
export class CroissantPayError extends Error {
  code: PurchaseErrorCode;
  underlyingError?: string;
  userRecoverable: boolean;

  constructor(
    code: PurchaseErrorCode,
    message: string,
    underlyingError?: string,
    userRecoverable: boolean = false
  ) {
    super(message);
    this.name = "CroissantPayError";
    this.code = code;
    this.underlyingError = underlyingError;
    this.userRecoverable = userRecoverable;
  }

  static fromPurchaseError(error: PurchaseError): CroissantPayError {
    return new CroissantPayError(
      error.code,
      error.message,
      error.underlyingError,
      error.userRecoverable
    );
  }

  /** Check if user cancelled the purchase */
  get isCancelled(): boolean {
    return this.code === "PURCHASE_CANCELLED";
  }

  /** Check if this is a network-related error */
  get isNetworkError(): boolean {
    return this.code === "NETWORK_ERROR";
  }

  /** Check if purchase is pending (e.g., parental approval) */
  get isPending(): boolean {
    return this.code === "PURCHASE_PENDING" || this.code === "PAYMENT_PENDING";
  }
}

// =============================================================================
// NATIVE MODULE
// =============================================================================

export interface NativeTransaction {
  transactionId: string;
  originalTransactionId?: string;
  receiptData: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
}

export interface NativeProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  priceAmountMicros: number;
  subscriptionPeriod?: string;
  introductoryPrice?: {
    price: number;
    priceString: string;
    period: string;
    periodCount: number;
    paymentMode: string;
  };
}

export interface NativeCroissantPayModule {
  configure(apiKey: string, apiUrl: string, debugLogs: boolean): Promise<void>;
  getProducts(productIds: string[]): Promise<NativeProduct[]>;
  purchase(productId: string): Promise<NativeTransaction>;
  restorePurchases(): Promise<{ transactions: NativeTransaction[] }>;
  finishTransaction(transactionId: string): Promise<void>;
  presentCodeRedemptionSheet?(): Promise<void>; // iOS only
  isConfigured(): Promise<boolean>;
  getAppUserId(): Promise<string | null>;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Check if a product is a subscription */
export function isSubscription(product: Product): boolean {
  return (
    product.type === "auto_renewable_subscription" ||
    product.type === "non_renewing_subscription"
  );
}

/** Check if a product is consumable */
export function isConsumable(product: Product): boolean {
  return product.type === "consumable";
}

/** Get the best available package from an offering */
export function getBestPackage(offering: Offering): Package | null {
  return (
    offering.annual ||
    offering.sixMonth ||
    offering.threeMonth ||
    offering.monthly ||
    offering.weekly ||
    offering.packages[0] ||
    null
  );
}

/** Parse ISO 8601 duration to human readable */
export function formatPeriod(period: string | null): string {
  if (!period) return "";
  
  const match = period.match(/P(\d+)([DWMY])/);
  if (!match) return period;

  const [, count, unit] = match;
  const num = parseInt(count, 10);

  switch (unit) {
    case "D":
      return num === 1 ? "day" : `${num} days`;
    case "W":
      return num === 1 ? "week" : `${num} weeks`;
    case "M":
      return num === 1 ? "month" : `${num} months`;
    case "Y":
      return num === 1 ? "year" : `${num} years`;
    default:
      return period;
  }
}
