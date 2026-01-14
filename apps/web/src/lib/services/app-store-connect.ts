import { SignJWT, importPKCS8 } from "jose";

// App Store Connect API types
export interface AppStoreProduct {
  id: string;
  type: string;
  attributes: {
    name: string;
    productId: string;
    inAppPurchaseType: "CONSUMABLE" | "NON_CONSUMABLE" | "AUTO_RENEWABLE" | "NON_RENEWING";
    state: "MISSING_METADATA" | "READY_TO_SUBMIT" | "WAITING_FOR_REVIEW" | "IN_REVIEW" | "DEVELOPER_ACTION_NEEDED" | "PENDING_BINARY_APPROVAL" | "APPROVED" | "DEVELOPER_REMOVED_FROM_SALE" | "REMOVED_FROM_SALE" | "REJECTED";
    reviewNote?: string;
    familySharable?: boolean;
    contentHosting?: boolean;
    availableInAllTerritories?: boolean;
  };
  relationships?: {
    subscriptionGroup?: {
      data?: {
        id: string;
        type: string;
      };
    };
  };
}

export interface SubscriptionGroup {
  id: string;
  type: string;
  attributes: {
    referenceName: string;
  };
}

export interface AppStoreSubscription {
  id: string;
  type: string;
  attributes: {
    name: string;
    productId: string;
    state: string;
    subscriptionPeriod: "ONE_WEEK" | "ONE_MONTH" | "TWO_MONTHS" | "THREE_MONTHS" | "SIX_MONTHS" | "ONE_YEAR";
    reviewNote?: string;
    groupLevel?: number;
    familySharable?: boolean;
    availableInAllTerritories?: boolean;
  };
  relationships?: {
    subscriptionGroup?: {
      data?: {
        id: string;
        type: string;
      };
    };
    introductoryOffers?: {
      data?: Array<{ id: string; type: string }>;
    };
  };
}

export interface AppStoreConnectConfig {
  privateKey: string;
  keyId: string;
  issuerId: string;
  bundleId: string;
}

// Map App Store Connect subscription period to ISO 8601 duration
const SUBSCRIPTION_PERIOD_MAP: Record<string, string> = {
  ONE_WEEK: "P7D",
  ONE_MONTH: "P1M",
  TWO_MONTHS: "P2M",
  THREE_MONTHS: "P3M",
  SIX_MONTHS: "P6M",
  ONE_YEAR: "P1Y",
};

// Map App Store Connect product type to our internal type
const PRODUCT_TYPE_MAP: Record<string, "consumable" | "non_consumable" | "auto_renewable_subscription" | "non_renewing_subscription"> = {
  CONSUMABLE: "consumable",
  NON_CONSUMABLE: "non_consumable",
  AUTO_RENEWABLE: "auto_renewable_subscription",
  NON_RENEWING: "non_renewing_subscription",
};

export interface SyncedProduct {
  storeProductId: string;
  displayName: string;
  type: "consumable" | "non_consumable" | "auto_renewable_subscription" | "non_renewing_subscription";
  subscriptionPeriod?: string;
  subscriptionGroupId?: string;
  state: string;
}

export class AppStoreConnectClient {
  private config: AppStoreConnectConfig;
  private baseUrl = "https://api.appstoreconnect.apple.com/v1";

  constructor(config: AppStoreConnectConfig) {
    this.config = config;
  }

  /**
   * Generate a JWT token for App Store Connect API authentication
   */
  private async generateToken(): Promise<string> {
    try {
      // Normalize the private key - ensure proper PEM format
      const normalizedKey = this.normalizePrivateKey(this.config.privateKey);
      
      // Import the private key using jose's importPKCS8
      const privateKey = await importPKCS8(normalizedKey, "ES256");

      const now = Math.floor(Date.now() / 1000);
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: this.config.keyId, typ: "JWT" })
        .setIssuedAt(now)
        .setExpirationTime(now + 20 * 60) // 20 minutes
        .setIssuer(this.config.issuerId)
        .setAudience("appstoreconnect-v1")
        .sign(privateKey);

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to generate JWT token. Please verify your credentials:\n` +
        `- Key ID should be a 10-character alphanumeric string (e.g., ABC123DEFG)\n` +
        `- Issuer ID should be a UUID (e.g., 57246542-96fe-1a63-e053-0824d0110)\n` +
        `- Private Key should be the complete contents of your .p8 file\n\n` +
        `Technical error: ${message}`
      );
    }
  }

  /**
   * Normalize the private key to ensure proper PEM format
   */
  private normalizePrivateKey(pem: string): string {
    // Trim whitespace
    let key = pem.trim();
    
    // If the key doesn't have proper headers, add them
    if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
      // Remove any existing partial headers or whitespace
      key = key
        .replace(/-----BEGIN.*?-----/g, "")
        .replace(/-----END.*?-----/g, "")
        .replace(/\s/g, "");
      
      // Add proper headers with line breaks every 64 characters
      const chunks = key.match(/.{1,64}/g) || [];
      key = `-----BEGIN PRIVATE KEY-----\n${chunks.join("\n")}\n-----END PRIVATE KEY-----`;
    }
    
    return key;
  }

  /**
   * Make an authenticated request to App Store Connect API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const token = await this.generateToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.errors?.[0]?.detail ||
          `App Store Connect API error: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Get all apps for this account
   */
  async getApps(): Promise<Array<{ id: string; bundleId: string; name: string }>> {
    const response = await this.request<{
      data: Array<{
        id: string;
        attributes: { bundleId: string; name: string };
      }>;
    }>("/apps?limit=200");

    return response.data.map((app) => ({
      id: app.id,
      bundleId: app.attributes.bundleId,
      name: app.attributes.name,
    }));
  }

  /**
   * Find app ID by bundle ID
   */
  async findAppByBundleId(bundleId: string): Promise<string | null> {
    const apps = await this.getApps();
    const app = apps.find((a) => a.bundleId === bundleId);
    return app?.id || null;
  }

  /**
   * Get all in-app purchases for an app
   */
  async getInAppPurchases(appId: string): Promise<AppStoreProduct[]> {
    const allProducts: AppStoreProduct[] = [];
    let nextUrl: string | null = `/apps/${appId}/inAppPurchasesV2?limit=200`;

    while (nextUrl) {
      const response = await this.request<{
        data: AppStoreProduct[];
        links?: { next?: string };
      }>(nextUrl);

      allProducts.push(...response.data);

      // Handle pagination
      if (response.links?.next) {
        nextUrl = response.links.next.replace(this.baseUrl, "");
      } else {
        nextUrl = null;
      }
    }

    return allProducts;
  }

  /**
   * Get all auto-renewable subscriptions for an app
   */
  async getSubscriptions(appId: string): Promise<AppStoreSubscription[]> {
    // First get all subscription groups
    const groupsResponse = await this.request<{
      data: SubscriptionGroup[];
    }>(`/apps/${appId}/subscriptionGroups?limit=200`);

    const allSubscriptions: AppStoreSubscription[] = [];

    // For each group, get the subscriptions
    for (const group of groupsResponse.data) {
      const subsResponse = await this.request<{
        data: AppStoreSubscription[];
      }>(`/subscriptionGroups/${group.id}/subscriptions?limit=200`);

      // Add group reference to each subscription
      allSubscriptions.push(
        ...subsResponse.data.map((sub) => ({
          ...sub,
          relationships: {
            ...sub.relationships,
            subscriptionGroup: { data: { id: group.id, type: "subscriptionGroups" } },
          },
        }))
      );
    }

    return allSubscriptions;
  }

  /**
   * Fetch all products (in-app purchases + subscriptions) from App Store Connect
   */
  async fetchAllProducts(): Promise<SyncedProduct[]> {
    // Find the app by bundle ID
    const appId = await this.findAppByBundleId(this.config.bundleId);
    if (!appId) {
      throw new Error(`App with bundle ID "${this.config.bundleId}" not found in App Store Connect`);
    }

    const products: SyncedProduct[] = [];

    // Fetch in-app purchases (consumables, non-consumables, non-renewing subscriptions)
    const inAppPurchases = await this.getInAppPurchases(appId);
    for (const iap of inAppPurchases) {
      // Skip if not in a valid state
      if (iap.attributes.state === "DEVELOPER_REMOVED_FROM_SALE" || 
          iap.attributes.state === "REMOVED_FROM_SALE") {
        continue;
      }

      products.push({
        storeProductId: iap.attributes.productId,
        displayName: iap.attributes.name,
        type: PRODUCT_TYPE_MAP[iap.attributes.inAppPurchaseType] || "non_consumable",
        state: iap.attributes.state,
        subscriptionGroupId: iap.relationships?.subscriptionGroup?.data?.id,
      });
    }

    // Fetch auto-renewable subscriptions
    const subscriptions = await this.getSubscriptions(appId);
    for (const sub of subscriptions) {
      // Skip if not in a valid state
      if (sub.attributes.state === "DEVELOPER_REMOVED_FROM_SALE" || 
          sub.attributes.state === "REMOVED_FROM_SALE") {
        continue;
      }

      products.push({
        storeProductId: sub.attributes.productId,
        displayName: sub.attributes.name,
        type: "auto_renewable_subscription",
        subscriptionPeriod: SUBSCRIPTION_PERIOD_MAP[sub.attributes.subscriptionPeriod],
        subscriptionGroupId: sub.relationships?.subscriptionGroup?.data?.id,
        state: sub.attributes.state,
      });
    }

    return products;
  }
}

/**
 * Create an App Store Connect client from app configuration
 */
export function createAppStoreConnectClient(app: {
  applePrivateKey: string | null;
  appleKeyId: string | null;
  appleIssuerId: string | null;
  bundleId: string | null;
}): AppStoreConnectClient {
  if (!app.applePrivateKey || !app.appleKeyId || !app.appleIssuerId) {
    throw new Error("App Store Connect API is not configured. Please add your API credentials in the app settings.");
  }

  if (!app.bundleId) {
    throw new Error("Bundle ID is required for syncing products from App Store Connect.");
  }

  return new AppStoreConnectClient({
    privateKey: app.applePrivateKey,
    keyId: app.appleKeyId,
    issuerId: app.appleIssuerId,
    bundleId: app.bundleId,
  });
}
