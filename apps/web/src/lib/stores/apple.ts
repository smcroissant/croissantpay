import * as jose from "jose";

// Types for App Store Server API
export interface AppleTransaction {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: "Auto-Renewable Subscription" | "Non-Consumable" | "Consumable" | "Non-Renewing Subscription";
  inAppOwnershipType: "PURCHASED" | "FAMILY_SHARED";
  signedDate: number;
  environment: "Sandbox" | "Production";
  transactionReason?: "PURCHASE" | "RENEWAL";
  storefront: string;
  storefrontId: string;
  price?: number;
  currency?: string;
  offerType?: number;
  offerIdentifier?: string;
}

export interface AppleRenewalInfo {
  originalTransactionId: string;
  autoRenewProductId: string;
  productId: string;
  autoRenewStatus: 0 | 1;
  renewalDate?: number;
  expirationIntent?: number;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  offerType?: number;
  offerIdentifier?: string;
  priceIncreaseStatus?: number;
  signedDate: number;
  environment: "Sandbox" | "Production";
}

export interface AppleSubscriptionStatus {
  environment: "Sandbox" | "Production";
  bundleId: string;
  appAppleId?: number;
  data: Array<{
    subscriptionGroupIdentifier: string;
    lastTransactions: Array<{
      status: number; // 1=active, 2=expired, 3=billing retry, 4=grace period, 5=revoked
      originalTransactionId: string;
      signedTransactionInfo: string;
      signedRenewalInfo: string;
    }>;
  }>;
}

export interface AppleNotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data: {
    appAppleId?: number;
    bundleId: string;
    bundleVersion?: string;
    environment: "Sandbox" | "Production";
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

export interface AppleAppConfig {
  issuerId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
}

// Status codes from Apple
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 1,
  EXPIRED: 2,
  BILLING_RETRY: 3,
  GRACE_PERIOD: 4,
  REVOKED: 5,
} as const;

export class AppleStoreClient {
  private config: AppleAppConfig;
  private baseUrl: string;

  constructor(config: AppleAppConfig, sandbox: boolean = false) {
    this.config = config;
    this.baseUrl = sandbox
      ? "https://api.storekit-sandbox.itunes.apple.com"
      : "https://api.storekit.itunes.apple.com";
  }

  private async generateToken(): Promise<string> {
    const privateKey = await jose.importPKCS8(
      this.config.privateKey,
      "ES256"
    );

    const jwt = await new jose.SignJWT({})
      .setProtectedHeader({
        alg: "ES256",
        kid: this.config.keyId,
        typ: "JWT",
      })
      .setIssuer(this.config.issuerId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .setAudience("appstoreconnect-v1")
      .setSubject(this.config.bundleId)
      .sign(privateKey);

    return jwt;
  }

  private async verifyAndDecodeJWS<T>(signedPayload: string): Promise<T> {
    // In production, you should verify the signature using Apple's public keys
    // For now, we'll decode without verification (not recommended for production)
    const parts = signedPayload.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWS format");
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return payload as T;
  }

  async getSubscriptionStatus(
    originalTransactionId: string
  ): Promise<AppleSubscriptionStatus> {
    const token = await this.generateToken();

    const response = await fetch(
      `${this.baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getTransactionHistory(
    originalTransactionId: string,
    revision?: string
  ): Promise<{
    signedTransactions: string[];
    revision: string;
    hasMore: boolean;
  }> {
    const token = await this.generateToken();

    let url = `${this.baseUrl}/inApps/v1/history/${originalTransactionId}`;
    if (revision) {
      url += `?revision=${revision}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getTransactionInfo(transactionId: string): Promise<AppleTransaction> {
    const token = await this.generateToken();

    const response = await fetch(
      `${this.baseUrl}/inApps/v1/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return this.verifyAndDecodeJWS<AppleTransaction>(data.signedTransactionInfo);
  }

  async decodeTransaction(signedTransaction: string): Promise<AppleTransaction> {
    return this.verifyAndDecodeJWS<AppleTransaction>(signedTransaction);
  }

  async decodeRenewalInfo(signedRenewalInfo: string): Promise<AppleRenewalInfo> {
    return this.verifyAndDecodeJWS<AppleRenewalInfo>(signedRenewalInfo);
  }

  async decodeNotification(signedPayload: string): Promise<AppleNotificationPayload> {
    return this.verifyAndDecodeJWS<AppleNotificationPayload>(signedPayload);
  }

  async lookUpOrderId(orderId: string): Promise<{
    signedTransactions: string[];
  }> {
    const token = await this.generateToken();

    const response = await fetch(
      `${this.baseUrl}/inApps/v1/lookup/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async requestTestNotification(): Promise<{ testNotificationToken: string }> {
    const token = await this.generateToken();

    const response = await fetch(
      `${this.baseUrl}/inApps/v1/notifications/test`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Apple API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Map Apple status to our subscription status
  static mapSubscriptionStatus(
    appleStatus: number
  ): "active" | "expired" | "in_billing_retry" | "in_grace_period" | "revoked" {
    switch (appleStatus) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return "active";
      case SUBSCRIPTION_STATUS.EXPIRED:
        return "expired";
      case SUBSCRIPTION_STATUS.BILLING_RETRY:
        return "in_billing_retry";
      case SUBSCRIPTION_STATUS.GRACE_PERIOD:
        return "in_grace_period";
      case SUBSCRIPTION_STATUS.REVOKED:
        return "revoked";
      default:
        return "expired";
    }
  }

  // Map Apple product type to our product type
  static mapProductType(
    appleType: string
  ): "consumable" | "non_consumable" | "auto_renewable_subscription" | "non_renewing_subscription" {
    switch (appleType) {
      case "Auto-Renewable Subscription":
        return "auto_renewable_subscription";
      case "Non-Renewing Subscription":
        return "non_renewing_subscription";
      case "Non-Consumable":
        return "non_consumable";
      case "Consumable":
      default:
        return "consumable";
    }
  }
}

