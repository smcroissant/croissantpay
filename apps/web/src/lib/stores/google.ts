import { google } from "googleapis";

// Types for Google Play Developer API
export interface GoogleSubscriptionPurchase {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number; // 0=pending, 1=received, 2=free trial, 3=pending deferred
  cancelReason?: number; // 0=user canceled, 1=system canceled, 2=replaced, 3=developer canceled
  userCancellationTimeMillis?: string;
  cancelSurveyResult?: {
    cancelSurveyReason: number;
    userInputCancelReason?: string;
  };
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType?: number; // 0=test, 1=promo
  acknowledgementState: number; // 0=pending, 1=acknowledged
  externalAccountId?: string;
  promotionType?: number;
  promotionCode?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

export interface GoogleSubscriptionPurchaseV2 {
  kind: string;
  regionCode: string;
  latestOrderId: string;
  lineItems: Array<{
    productId: string;
    expiryTime: string;
    autoRenewingPlan?: {
      autoRenewEnabled: boolean;
    };
    prepaidPlan?: {
      allowExtendAfterTime: string;
    };
    offerDetails?: {
      basePlanId: string;
      offerId?: string;
      offerTags?: string[];
    };
  }>;
  startTime: string;
  subscriptionState:
    | "SUBSCRIPTION_STATE_UNSPECIFIED"
    | "SUBSCRIPTION_STATE_PENDING"
    | "SUBSCRIPTION_STATE_ACTIVE"
    | "SUBSCRIPTION_STATE_PAUSED"
    | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
    | "SUBSCRIPTION_STATE_ON_HOLD"
    | "SUBSCRIPTION_STATE_CANCELED"
    | "SUBSCRIPTION_STATE_EXPIRED";
  linkedPurchaseToken?: string;
  pausedStateContext?: {
    autoResumeTime: string;
  };
  canceledStateContext?: {
    userInitiatedCancellation?: {
      cancelSurveyResult?: {
        reason: string;
        reasonUserInput?: string;
      };
      cancelTime: string;
    };
    systemInitiatedCancellation?: Record<string, unknown>;
    developerInitiatedCancellation?: Record<string, unknown>;
    replacementCancellation?: {
      replacementPurchaseToken: string;
    };
  };
  testPurchase?: Record<string, unknown>;
  acknowledgementState: "ACKNOWLEDGEMENT_STATE_UNSPECIFIED" | "ACKNOWLEDGEMENT_STATE_PENDING" | "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";
  externalAccountIdentifiers?: {
    externalAccountId?: string;
    obfuscatedExternalAccountId?: string;
    obfuscatedExternalProfileId?: string;
  };
  subscribeWithGoogleInfo?: {
    emailAddress: string;
    familyName?: string;
    givenName?: string;
    profileId: string;
    profileName?: string;
  };
}

export interface GoogleProductPurchase {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number; // 0=purchased, 1=canceled, 2=pending
  consumptionState: number; // 0=not consumed, 1=consumed
  developerPayload: string;
  orderId: string;
  purchaseType?: number; // 0=test, 1=promo, 2=rewarded
  acknowledgementState: number; // 0=pending, 1=acknowledged
  purchaseToken: string;
  productId: string;
  quantity: number;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
  regionCode: string;
}

export interface GoogleRTDNPayload {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken: string;
    orderId: string;
    productType: number;
    refundType?: number;
  };
  testNotification?: {
    version: string;
  };
}

// Notification types
export const SUBSCRIPTION_NOTIFICATION_TYPE = {
  SUBSCRIPTION_RECOVERED: 1, // Subscription recovered from billing retry
  SUBSCRIPTION_RENEWED: 2, // Active subscription renewed
  SUBSCRIPTION_CANCELED: 3, // User canceled
  SUBSCRIPTION_PURCHASED: 4, // New subscription purchased
  SUBSCRIPTION_ON_HOLD: 5, // Subscription on hold (payment issue)
  SUBSCRIPTION_IN_GRACE_PERIOD: 6, // In grace period
  SUBSCRIPTION_RESTARTED: 7, // User restarted subscription
  SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8, // Price change confirmed
  SUBSCRIPTION_DEFERRED: 9, // Subscription deferred
  SUBSCRIPTION_PAUSED: 10, // Subscription paused
  SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11, // Pause schedule changed
  SUBSCRIPTION_REVOKED: 12, // Subscription revoked
  SUBSCRIPTION_EXPIRED: 13, // Subscription expired
} as const;

export const ONE_TIME_NOTIFICATION_TYPE = {
  ONE_TIME_PRODUCT_PURCHASED: 1,
  ONE_TIME_PRODUCT_CANCELED: 2,
} as const;

export interface GoogleAppConfig {
  serviceAccountKey: string; // JSON string
  packageName: string;
}

export class GooglePlayClient {
  private packageName: string;
  private androidPublisher: ReturnType<typeof google.androidpublisher>;

  constructor(config: GoogleAppConfig) {
    this.packageName = config.packageName;

    const serviceAccount = JSON.parse(config.serviceAccountKey);
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    this.androidPublisher = google.androidpublisher({
      version: "v3",
      auth,
    });
  }

  async getSubscription(
    subscriptionId: string,
    purchaseToken: string
  ): Promise<GoogleSubscriptionPurchase> {
    const response = await this.androidPublisher.purchases.subscriptions.get({
      packageName: this.packageName,
      subscriptionId,
      token: purchaseToken,
    });

    return response.data as GoogleSubscriptionPurchase;
  }

  async getSubscriptionV2(
    purchaseToken: string
  ): Promise<GoogleSubscriptionPurchaseV2> {
    const response =
      await this.androidPublisher.purchases.subscriptionsv2.get({
        packageName: this.packageName,
        token: purchaseToken,
      });

    return response.data as GoogleSubscriptionPurchaseV2;
  }

  async acknowledgeSubscription(
    subscriptionId: string,
    purchaseToken: string,
    developerPayload?: string
  ): Promise<void> {
    await this.androidPublisher.purchases.subscriptions.acknowledge({
      packageName: this.packageName,
      subscriptionId,
      token: purchaseToken,
      requestBody: {
        developerPayload,
      },
    });
  }

  async cancelSubscription(
    subscriptionId: string,
    purchaseToken: string
  ): Promise<void> {
    await this.androidPublisher.purchases.subscriptions.cancel({
      packageName: this.packageName,
      subscriptionId,
      token: purchaseToken,
    });
  }

  async refundSubscription(
    subscriptionId: string,
    purchaseToken: string
  ): Promise<void> {
    await this.androidPublisher.purchases.subscriptions.refund({
      packageName: this.packageName,
      subscriptionId,
      token: purchaseToken,
    });
  }

  async revokeSubscription(
    subscriptionId: string,
    purchaseToken: string
  ): Promise<void> {
    await this.androidPublisher.purchases.subscriptions.revoke({
      packageName: this.packageName,
      subscriptionId,
      token: purchaseToken,
    });
  }

  async getProduct(
    productId: string,
    purchaseToken: string
  ): Promise<GoogleProductPurchase> {
    const response = await this.androidPublisher.purchases.products.get({
      packageName: this.packageName,
      productId,
      token: purchaseToken,
    });

    return response.data as GoogleProductPurchase;
  }

  async acknowledgeProduct(
    productId: string,
    purchaseToken: string,
    developerPayload?: string
  ): Promise<void> {
    await this.androidPublisher.purchases.products.acknowledge({
      packageName: this.packageName,
      productId,
      token: purchaseToken,
      requestBody: {
        developerPayload,
      },
    });
  }

  async consumeProduct(
    productId: string,
    purchaseToken: string
  ): Promise<void> {
    await this.androidPublisher.purchases.products.consume({
      packageName: this.packageName,
      productId,
      token: purchaseToken,
    });
  }

  // Decode RTDN payload from Pub/Sub message
  static decodeRTDNPayload(base64Data: string): GoogleRTDNPayload {
    const jsonString = Buffer.from(base64Data, "base64").toString("utf-8");
    return JSON.parse(jsonString);
  }

  // Map Google subscription state to our status
  static mapSubscriptionStatus(
    state: GoogleSubscriptionPurchaseV2["subscriptionState"]
  ): "active" | "expired" | "canceled" | "paused" | "in_grace_period" | "in_billing_retry" {
    switch (state) {
      case "SUBSCRIPTION_STATE_ACTIVE":
        return "active";
      case "SUBSCRIPTION_STATE_EXPIRED":
        return "expired";
      case "SUBSCRIPTION_STATE_CANCELED":
        return "canceled";
      case "SUBSCRIPTION_STATE_PAUSED":
        return "paused";
      case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
        return "in_grace_period";
      case "SUBSCRIPTION_STATE_ON_HOLD":
        return "in_billing_retry";
      case "SUBSCRIPTION_STATE_PENDING":
      default:
        return "active";
    }
  }

  // Map legacy subscription for backwards compatibility
  static mapLegacySubscriptionStatus(
    purchase: GoogleSubscriptionPurchase
  ): "active" | "expired" | "canceled" {
    const now = Date.now();
    const expiryTime = parseInt(purchase.expiryTimeMillis);

    if (purchase.cancelReason !== undefined) {
      return "canceled";
    }

    if (expiryTime < now) {
      return "expired";
    }

    return "active";
  }
}

