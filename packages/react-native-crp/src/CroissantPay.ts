import { Platform, NativeModules } from "react-native";
import type {
  CroissantPayConfig,
  SubscriberInfo,
  Offerings,
  Product,
  PurchaseResult,
  RestoreResult,
  PurchaseError,
  NativeCroissantPayModule,
} from "./types";

const LINKING_ERROR =
  `The package '@croissantpay/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

// Get native module or use mock for development
const NativeCroissantPay: NativeCroissantPayModule | null =
  NativeModules.CroissantPay
    ? NativeModules.CroissantPay
    : new Proxy(
        {},
        {
          get() {
            // Return mock functions during development
            return async () => {
              console.warn(LINKING_ERROR);
              return null;
            };
          },
        }
      );

class CroissantPaySDK {
  private config: CroissantPayConfig | null = null;
  private subscriberInfo: SubscriberInfo | null = null;
  private offerings: Offerings | null = null;
  private apiBaseUrl: string = "https://api.croissantpay.dev";

  private log(...args: unknown[]) {
    if (this.config?.debugLogs) {
      console.log("[CroissantPay]", ...args);
    }
  }

  /**
   * Configure the CroissantPay SDK
   */
  async configure(config: CroissantPayConfig): Promise<void> {
    this.config = {
      ...config,
      apiUrl: config.apiUrl || this.apiBaseUrl,
    };

    this.apiBaseUrl = this.config.apiUrl!;
    this.log("Configured with API URL:", this.apiBaseUrl);

    // Configure native module
    if (NativeCroissantPay) {
      await NativeCroissantPay.configure(
        this.config.apiKey,
        this.apiBaseUrl,
        this.config.debugLogs || false
      );
    }

    // If app user ID provided, identify immediately
    if (config.appUserId) {
      await this.identify(config.appUserId);
    }
  }

  /**
   * Identify the current user
   */
  async identify(appUserId: string): Promise<SubscriberInfo> {
    this.assertConfigured();

    this.config!.appUserId = appUserId;
    this.log("Identifying user:", appUserId);

    const response = await this.apiRequest<{ subscriber: SubscriberInfo }>(
      `subscribers/${encodeURIComponent(appUserId)}`
    );

    this.subscriberInfo = this.parseSubscriberInfo(response.subscriber);
    return this.subscriberInfo;
  }

  /**
   * Get the current subscriber info
   */
  async getSubscriberInfo(): Promise<SubscriberInfo> {
    this.assertConfigured();
    this.assertIdentified();

    const response = await this.apiRequest<{ subscriber: SubscriberInfo }>(
      `subscribers/${encodeURIComponent(this.config!.appUserId!)}`
    );

    this.subscriberInfo = this.parseSubscriberInfo(response.subscriber);
    return this.subscriberInfo;
  }

  /**
   * Get available offerings and products
   */
  async getOfferings(): Promise<Offerings> {
    this.assertConfigured();

    const response = await this.apiRequest<Offerings>("offerings");
    
    // Parse the response and set current offering shortcut
    this.offerings = {
      ...response,
      current: response.currentOfferingId
        ? response.offerings[response.currentOfferingId]
        : null,
    };

    // Fetch native store product info
    if (NativeCroissantPay && response.offerings) {
      const allProductIds: string[] = [];
      Object.values(response.offerings).forEach((offering) => {
        offering.products.forEach((product) => {
          if (
            (Platform.OS === "ios" && product.platform === "ios") ||
            (Platform.OS === "android" && product.platform === "android")
          ) {
            allProductIds.push(product.storeProductId);
          }
        });
      });

      if (allProductIds.length > 0) {
        try {
          const nativeProducts = await NativeCroissantPay.getProducts(allProductIds);
          // Merge native product info
          this.mergeNativeProductInfo(nativeProducts as unknown as Product[]);
        } catch (error) {
          this.log("Error fetching native products:", error);
        }
      }
    }

    return this.offerings;
  }

  /**
   * Purchase a product
   */
  async purchase(productIdentifier: string): Promise<PurchaseResult> {
    this.assertConfigured();
    this.assertIdentified();

    this.log("Purchasing:", productIdentifier);

    // Find the product
    const product = this.findProduct(productIdentifier);
    if (!product) {
      return {
        success: false,
        subscriberInfo: this.subscriberInfo!,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product ${productIdentifier} not found in offerings`,
        },
      };
    }

    try {
      // Execute native purchase
      if (!NativeCroissantPay) {
        throw new Error("Native module not available");
      }

      const purchaseResult = await NativeCroissantPay.purchase(product.storeProductId);

      // Validate receipt with backend
      const validationResult = await this.validateReceipt(
        purchaseResult.receiptData,
        product
      );

      // Finish the transaction
      await NativeCroissantPay.finishTransaction(purchaseResult.transactionId);

      return {
        success: true,
        subscriberInfo: validationResult,
        transactionId: purchaseResult.transactionId,
      };
    } catch (error: unknown) {
      const purchaseError = this.parsePurchaseError(error);
      this.log("Purchase error:", purchaseError);

      return {
        success: false,
        subscriberInfo: this.subscriberInfo!,
        error: purchaseError,
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<RestoreResult> {
    this.assertConfigured();
    this.assertIdentified();

    this.log("Restoring purchases");

    try {
      if (!NativeCroissantPay) {
        throw new Error("Native module not available");
      }

      const result = await NativeCroissantPay.restorePurchases();

      // Validate each restored transaction
      for (const transaction of result.transactions) {
        const product = this.findProductByStoreId(transaction.productId);
        if (product) {
          await this.validateReceipt(transaction.receiptData, product);
          await NativeCroissantPay.finishTransaction(transaction.transactionId);
        }
      }

      // Get updated subscriber info
      const subscriberInfo = await this.getSubscriberInfo();

      return {
        success: true,
        subscriberInfo,
        restoredTransactions: result.transactions.length,
      };
    } catch (error) {
      this.log("Restore error:", error);
      return {
        success: false,
        subscriberInfo: this.subscriberInfo!,
        restoredTransactions: 0,
      };
    }
  }

  /**
   * Update subscriber attributes
   */
  async setAttributes(attributes: Record<string, unknown>): Promise<void> {
    this.assertConfigured();
    this.assertIdentified();

    await this.apiRequest(
      `subscribers/${encodeURIComponent(this.config!.appUserId!)}/attributes`,
      {
        method: "POST",
        body: JSON.stringify({ attributes }),
      }
    );
  }

  /**
   * Check if user has active entitlement
   */
  hasActiveEntitlement(entitlementId: string): boolean {
    if (!this.subscriberInfo) return false;
    const entitlement = this.subscriberInfo.entitlements[entitlementId];
    return entitlement?.isActive ?? false;
  }

  /**
   * Get current cached subscriber info (synchronous)
   */
  getCachedSubscriberInfo(): SubscriberInfo | null {
    return this.subscriberInfo;
  }

  /**
   * Get current cached offerings (synchronous)
   */
  getCachedOfferings(): Offerings | null {
    return this.offerings;
  }

  // Private methods

  private assertConfigured() {
    if (!this.config) {
      throw new Error("CroissantPay SDK not configured. Call configure() first.");
    }
  }

  private assertIdentified() {
    if (!this.config?.appUserId) {
      throw new Error("User not identified. Call identify() or pass appUserId to configure().");
    }
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiBaseUrl}/api/v1/${endpoint}`;
    this.log("API Request:", url);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config!.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  private async validateReceipt(
    receiptData: string,
    product: Product
  ): Promise<SubscriberInfo> {
    const isSubscription = product.type.includes("subscription");

    const response = await this.apiRequest<{ subscriber: SubscriberInfo }>(
      "receipts",
      {
        method: "POST",
        body: JSON.stringify({
          appUserId: this.config!.appUserId,
          platform: Platform.OS === "ios" ? "ios" : "android",
          receiptData,
          productId: product.storeProductId,
          subscriptionId: isSubscription ? product.storeProductId : undefined,
        }),
      }
    );

    this.subscriberInfo = this.parseSubscriberInfo(response.subscriber);
    return this.subscriberInfo;
  }

  private parseSubscriberInfo(data: SubscriberInfo): SubscriberInfo {
    // Parse dates
    return {
      ...data,
      firstSeenAt: new Date(data.firstSeenAt),
      lastSeenAt: new Date(data.lastSeenAt),
      entitlements: Object.fromEntries(
        Object.entries(data.entitlements).map(([key, entitlement]) => [
          key,
          {
            ...entitlement,
            expiresDate: entitlement.expiresDate
              ? new Date(entitlement.expiresDate)
              : null,
            purchaseDate: entitlement.purchaseDate
              ? new Date(entitlement.purchaseDate)
              : null,
            latestPurchaseDate: entitlement.latestPurchaseDate
              ? new Date(entitlement.latestPurchaseDate)
              : null,
            originalPurchaseDate: entitlement.originalPurchaseDate
              ? new Date(entitlement.originalPurchaseDate)
              : null,
          },
        ])
      ),
      nonSubscriptionPurchases: data.nonSubscriptionPurchases.map((p) => ({
        ...p,
        purchaseDate: new Date(p.purchaseDate),
      })),
    };
  }

  private findProduct(identifier: string): Product | null {
    if (!this.offerings) return null;

    for (const offering of Object.values(this.offerings.offerings)) {
      const product = offering.products.find((p) => p.identifier === identifier);
      if (product) return product;
    }

    return null;
  }

  private findProductByStoreId(storeProductId: string): Product | null {
    if (!this.offerings) return null;

    for (const offering of Object.values(this.offerings.offerings)) {
      const product = offering.products.find(
        (p) => p.storeProductId === storeProductId
      );
      if (product) return product;
    }

    return null;
  }

  private mergeNativeProductInfo(nativeProducts: Product[]) {
    if (!this.offerings) return;

    const productMap = new Map(
      nativeProducts.map((p) => [p.storeProductId, p])
    );

    Object.values(this.offerings.offerings).forEach((offering) => {
      offering.products = offering.products.map((product) => {
        const nativeInfo = productMap.get(product.storeProductId);
        if (nativeInfo) {
          return {
            ...product,
            price: nativeInfo.price,
            priceString: nativeInfo.priceString,
            currencyCode: nativeInfo.currencyCode,
          };
        }
        return product;
      });
    });
  }

  private parsePurchaseError(error: unknown): PurchaseError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("cancel")) {
        return { code: "PURCHASE_CANCELLED", message: "Purchase was cancelled" };
      }
      if (message.includes("pending")) {
        return { code: "PURCHASE_PENDING", message: "Purchase is pending" };
      }
      if (message.includes("network")) {
        return { code: "NETWORK_ERROR", message: "Network error occurred" };
      }
      if (message.includes("already")) {
        return { code: "ALREADY_PURCHASED", message: "Product already purchased" };
      }

      return {
        code: "STORE_ERROR",
        message: error.message,
        underlyingError: error.stack,
      };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    };
  }
}

// Export singleton instance
export const CroissantPay = new CroissantPaySDK();

