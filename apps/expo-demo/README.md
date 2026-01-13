# CroissantPay Expo Demo

A demo Expo app showcasing the CroissantPay SDK for in-app purchases.

## Features

- 🏠 **Home Screen** - Account status and quick actions
- 🛒 **Products Screen** - Browse and purchase products
- ⭐ **Subscription Screen** - Manage subscriptions and entitlements
- ⚙️ **Settings Screen** - App configuration and developer tools
- 💳 **Paywall Modal** - Beautiful upgrade flow with plan selection

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Navigate to the demo app
cd apps/expo-demo

# Start the development server
pnpm start
```

### Running on Devices

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Web browser
pnpm web
```

## Configuration

Edit `app/_layout.tsx` to configure the CroissantPay SDK:

```tsx
const CROISSANTPAY_CONFIG = {
  // Your CroissantPay API key from the dashboard
  apiKey: "mx_public_your_api_key_here",
  
  // For self-hosted: use your server URL
  // For cloud: use https://api.croissantpay.dev
  apiUrl: "http://localhost:3000",
};
```

## Project Structure

```
apps/expo-demo/
├── app/
│   ├── _layout.tsx        # Root layout with CroissantPayProvider
│   ├── paywall.tsx        # Paywall modal screen
│   └── (tabs)/
│       ├── _layout.tsx    # Tab navigation
│       ├── index.tsx      # Home screen
│       ├── products.tsx   # Products list
│       ├── subscription.tsx # Subscription management
│       └── settings.tsx   # Settings
├── assets/
│   └── images/            # App icons and images
├── app.json               # Expo configuration
├── metro.config.js        # Metro bundler config for monorepo
└── package.json
```

## SDK Usage Examples

### Check Entitlements

```tsx
import { usePurchases } from "@croissantpay/react-native";

function MyComponent() {
  const { hasEntitlement } = usePurchases();
  
  if (hasEntitlement("pro")) {
    return <ProFeature />;
  }
  return <UpgradePrompt />;
}
```

### Purchase a Product

```tsx
import { usePurchases } from "@croissantpay/react-native";

function BuyButton({ product }) {
  const { purchaseProduct } = usePurchases();
  
  const handlePurchase = async () => {
    try {
      await purchaseProduct(product);
      // Purchase successful!
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };
  
  return (
    <Button 
      title={`Buy for ${product.priceString}`} 
      onPress={handlePurchase} 
    />
  );
}
```

### Get Available Products

```tsx
import { usePurchases } from "@croissantpay/react-native";

function ProductList() {
  const { offerings, isLoading } = usePurchases();
  
  if (isLoading) return <Loading />;
  
  const packages = offerings?.current?.packages || [];
  
  return (
    <FlatList
      data={packages}
      renderItem={({ item }) => (
        <ProductCard product={item.product} />
      )}
    />
  );
}
```

### Restore Purchases

```tsx
import { usePurchases } from "@croissantpay/react-native";

function RestoreButton() {
  const { restorePurchases } = usePurchases();
  
  return (
    <Button 
      title="Restore Purchases" 
      onPress={restorePurchases} 
    />
  );
}
```

## Building for Production

### iOS

1. Set up your App Store Connect account
2. Configure in-app products in App Store Connect
3. Add products to CroissantPay dashboard
4. Build and submit:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

### Android

1. Set up your Google Play Console account
2. Configure in-app products in Play Console
3. Add products to CroissantPay dashboard
4. Build and submit:

```bash
eas build --platform android --profile production
eas submit --platform android
```

## Troubleshooting

### Products not loading

1. Make sure CroissantPay server is running
2. Check API key is correct
3. Verify products are configured in dashboard
4. For real device testing, products must be set up in App Store Connect / Play Console

### Purchase failures

- On simulators, purchases will fail (expected behavior)
- Test on real devices with sandbox accounts
- Check webhook configuration in CroissantPay dashboard

## License

MIT

