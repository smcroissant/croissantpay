# @croissantpay/react-native

React Native SDK for CroissantPay - Self-hosted in-app purchase and subscription management.

> **Note:** The package folder is named `react-native-crp` where **CRP** stands for **CR**oissant**P**ay.

## Installation

```bash
npm install @croissantpay/react-native
# or
yarn add @croissantpay/react-native
```

### iOS

```bash
cd ios && pod install
```

### Android

No additional steps required.

## Quick Start

### 1. Initialize the SDK

```tsx
import { CroissantPay } from '@croissantpay/react-native';

// In your app initialization
await CroissantPay.configure({
  apiKey: 'mx_public_your_api_key',
  apiUrl: 'https://your-croissantpay-instance.com', // Your CroissantPay server URL
  appUserId: 'user_123', // Optional: identify user immediately
  debugLogs: __DEV__,
});
```

### 2. Using the Provider (Recommended)

```tsx
import { CroissantPayProvider, usePurchases } from '@croissantpay/react-native';

function App() {
  return (
    <CroissantPayProvider
      config={{
        apiKey: 'mx_public_your_api_key',
        apiUrl: 'https://your-croissantpay-instance.com',
        appUserId: 'user_123',
      }}
    >
      <YourApp />
    </CroissantPayProvider>
  );
}

function PaywallScreen() {
  const { offerings, purchase, isLoading, hasEntitlement } = usePurchases();

  if (hasEntitlement('premium')) {
    return <PremiumContent />;
  }

  const currentOffering = offerings?.offerings[offerings.currentOfferingId!];

  return (
    <View>
      {currentOffering?.products.map((product) => (
        <TouchableOpacity
          key={product.identifier}
          onPress={() => purchase(product.identifier)}
          disabled={isLoading}
        >
          <Text>{product.displayName}</Text>
          <Text>{product.priceString}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### 3. Direct SDK Usage

```tsx
import { CroissantPay } from '@croissantpay/react-native';

// Get subscriber info
const subscriberInfo = await CroissantPay.getSubscriberInfo();

// Check entitlements
if (subscriberInfo.entitlements.premium?.isActive) {
  // User has premium access
}

// Get offerings
const offerings = await CroissantPay.getOfferings();

// Make a purchase
const result = await CroissantPay.purchase('monthly_premium');
if (result.success) {
  console.log('Purchase successful!');
}

// Restore purchases
const restoreResult = await CroissantPay.restorePurchases();
```

## API Reference

### CroissantPay

#### `configure(config: CroissantPayConfig): Promise<void>`

Initialize the SDK with your configuration.

```ts
interface CroissantPayConfig {
  apiKey: string;        // Your CroissantPay public API key
  apiUrl?: string;       // Your CroissantPay server URL
  appUserId?: string;    // User ID to identify immediately
  debugLogs?: boolean;   // Enable debug logging
}
```

#### `identify(appUserId: string): Promise<SubscriberInfo>`

Identify the current user. Call this when a user logs in.

#### `getSubscriberInfo(): Promise<SubscriberInfo>`

Get the current subscriber's info and entitlements.

#### `getOfferings(): Promise<Offerings>`

Get available product offerings.

#### `purchase(productIdentifier: string): Promise<PurchaseResult>`

Initiate a purchase for the given product.

#### `restorePurchases(): Promise<RestoreResult>`

Restore previous purchases. Call this to restore purchases for returning users.

#### `setAttributes(attributes: Record<string, unknown>): Promise<void>`

Set custom attributes for the subscriber.

### Hooks

#### `usePurchases()`

Main hook for accessing purchase functionality.

```ts
const {
  isConfigured,    // boolean
  isLoading,       // boolean
  subscriberInfo,  // SubscriberInfo | null
  offerings,       // Offerings | null
  error,           // Error | null
  identify,        // (appUserId: string) => Promise<SubscriberInfo | null>
  purchase,        // (productId: string) => Promise<PurchaseResult | null>
  restore,         // () => Promise<RestoreResult | null>
  refresh,         // () => Promise<void>
  hasEntitlement,  // (entitlementId: string) => boolean
} = usePurchases();
```

#### `useEntitlement(entitlementId: string)`

Check a specific entitlement.

```ts
const { entitlement, isActive, isLoading } = useEntitlement('premium');
```

#### `useCurrentOffering()`

Get the current default offering.

```ts
const { offering, isLoading } = useCurrentOffering();
```

## Types

### SubscriberInfo

```ts
interface SubscriberInfo {
  appUserId: string;
  entitlements: Record<string, Entitlement>;
  activeSubscriptions: string[];
  nonSubscriptionPurchases: Array<{
    productIdentifier: string;
    purchaseDate: Date;
    transactionId: string;
  }>;
}
```

### Entitlement

```ts
interface Entitlement {
  identifier: string;
  isActive: boolean;
  expiresDate: Date | null;
  productIdentifier: string | null;
  willRenew: boolean;
  periodType: 'normal' | 'trial' | 'intro';
  isSandbox: boolean;
}
```

### Product

```ts
interface Product {
  identifier: string;
  storeProductId: string;
  displayName: string;
  description: string | null;
  price?: string;
  priceString?: string;
  currencyCode?: string;
  subscriptionPeriod: string | null;
  trialDuration: string | null;
}
```

## License

MIT

