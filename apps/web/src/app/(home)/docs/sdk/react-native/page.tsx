import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  Terminal,
  Code,
  Zap,
  Check,
  Package,
} from "lucide-react";

export default function ReactNativeSDKPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/docs"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">React Native SDK</h1>
            <p className="text-sm text-muted-foreground">
              Install and configure the CroissantPay SDK
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Intro */}
          <p className="lead text-xl text-muted-foreground">
            The CroissantPay React Native SDK provides a simple API to manage in-app
            purchases, subscriptions, and entitlements in your mobile apps.
          </p>

          {/* Installation */}
          <h2 className="flex items-center gap-2 mt-12">
            <Package className="w-6 h-6 text-primary" />
            Installation
          </h2>

          <div className="not-prose">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-medium">Terminal</span>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code>{`# Using npm
npm install @croissantpay/react-native

# Using yarn
yarn add @croissantpay/react-native

# Using pnpm
pnpm add @croissantpay/react-native`}</code>
              </pre>
            </div>
          </div>

          <h3>iOS Setup</h3>
          <p>Install CocoaPods dependencies:</p>

          <div className="not-prose">
            <CodeBlock code="cd ios && pod install" />
          </div>

          <h3>Android Setup</h3>
          <p>
            No additional setup required. The SDK automatically links with React
            Native 0.60+.
          </p>

          {/* Configuration */}
          <h2 className="flex items-center gap-2 mt-12">
            <Zap className="w-6 h-6 text-primary" />
            Quick Start
          </h2>

          <h3>1. Wrap your app with CroissantPayProvider</h3>

          <div className="not-prose">
            <CodeBlock
              title="App.tsx"
              code={`import { CroissantPayProvider } from '@croissantpay/react-native';

export default function App() {
  return (
    <CroissantPayProvider
      config={{
        apiKey: 'mx_public_your_key', // From CroissantPay dashboard
        apiUrl: 'https://api.croissantpay.dev', // Or your self-hosted URL
        appUserId: user?.id, // Your user's ID
        debugLogs: __DEV__, // Enable logs in development
      }}
    >
      <YourApp />
    </CroissantPayProvider>
  );
}`}
            />
          </div>

          <h3>2. Use the usePurchases hook</h3>

          <div className="not-prose">
            <CodeBlock
              title="PaywallScreen.tsx"
              code={`import { usePurchases } from '@croissantpay/react-native';

export function PaywallScreen() {
  const {
    offerings,
    subscriberInfo,
    purchase,
    restore,
    hasEntitlement,
    isLoading,
  } = usePurchases();

  // Check if user has premium access
  if (hasEntitlement('premium')) {
    return <PremiumContent />;
  }

  // Get current offering products
  const currentOffering = offerings?.current;
  const products = currentOffering?.products || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock Premium</Text>
      
      {products.map((product) => (
        <TouchableOpacity
          key={product.identifier}
          style={styles.productButton}
          onPress={() => purchase(product.identifier)}
          disabled={isLoading}
        >
          <Text style={styles.productName}>{product.displayName}</Text>
          <Text style={styles.productPrice}>{product.priceString}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={restore} disabled={isLoading}>
        <Text>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
}`}
            />
          </div>

          {/* API Reference */}
          <h2 className="flex items-center gap-2 mt-12">
            <Code className="w-6 h-6 text-primary" />
            API Reference
          </h2>

          <h3>CroissantPayProvider Props</h3>

          <div className="not-prose">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Prop</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">apiKey</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2">
                      Your CroissantPay public API key (required)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">apiUrl</td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2">
                      API URL (defaults to https://api.croissantpay.dev)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      appUserId
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">string</td>
                    <td className="px-4 py-2">Your app&apos;s user identifier</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      debugLogs
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">boolean</td>
                    <td className="px-4 py-2">Enable debug logging</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3>usePurchases Hook</h3>

          <div className="not-prose">
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">
                      Property
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      isConfigured
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">boolean</td>
                    <td className="px-4 py-2">Whether SDK is configured</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      isLoading
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">boolean</td>
                    <td className="px-4 py-2">
                      Loading state for async operations
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      subscriberInfo
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      SubscriberInfo | null
                    </td>
                    <td className="px-4 py-2">
                      Current subscriber data with entitlements
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">
                      offerings
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      Offerings | null
                    </td>
                    <td className="px-4 py-2">Available products and packages</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-primary">error</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      Error | null
                    </td>
                    <td className="px-4 py-2">Last error that occurred</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3>Methods</h3>

          <div className="not-prose space-y-4">
            <MethodDoc
              name="purchase(productIdentifier)"
              returns="Promise<PurchaseResult>"
              description="Purchase a product by its identifier. Handles native store flow and receipt validation."
            />
            <MethodDoc
              name="restore()"
              returns="Promise<RestoreResult>"
              description="Restore previous purchases. Useful for users reinstalling the app or switching devices."
            />
            <MethodDoc
              name="identify(appUserId)"
              returns="Promise<SubscriberInfo>"
              description="Identify or switch the current user. Call this when your user logs in."
            />
            <MethodDoc
              name="refresh()"
              returns="Promise<void>"
              description="Refresh subscriber info and offerings from the server."
            />
            <MethodDoc
              name="hasEntitlement(entitlementId)"
              returns="boolean"
              description="Check if user has an active entitlement. Quick way to gate premium features."
            />
          </div>

          {/* Additional Hooks */}
          <h2 className="mt-12">Additional Hooks</h2>

          <h3>useEntitlement</h3>
          <p>Check a specific entitlement:</p>

          <div className="not-prose">
            <CodeBlock
              code={`import { useEntitlement } from '@croissantpay/react-native';

function PremiumFeature() {
  const { isActive, entitlement, isLoading } = useEntitlement('premium');

  if (isLoading) return <Loading />;
  if (!isActive) return <UpgradePrompt />;

  return <PremiumContent expiresAt={entitlement.expiresDate} />;
}`}
            />
          </div>

          <h3>useCurrentOffering</h3>
          <p>Get the current offering directly:</p>

          <div className="not-prose">
            <CodeBlock
              code={`import { useCurrentOffering } from '@croissantpay/react-native';

function Paywall() {
  const { offering, isLoading } = useCurrentOffering();

  if (isLoading || !offering) return null;

  return (
    <View>
      {offering.monthly && (
        <ProductCard product={offering.monthly.product} />
      )}
      {offering.annual && (
        <ProductCard product={offering.annual.product} badge="Best Value" />
      )}
    </View>
  );
}`}
            />
          </div>

          {/* Helpers */}
          <h2 className="mt-12">Helper Functions</h2>

          <div className="not-prose">
            <CodeBlock
              code={`import { 
  isSubscription, 
  isConsumable, 
  formatPeriod,
  getBestPackage 
} from '@croissantpay/react-native';

// Check product type
isSubscription(product); // true for subscription products
isConsumable(product);   // true for consumable products

// Format subscription period
formatPeriod('P1M');  // "month"
formatPeriod('P1Y');  // "year"
formatPeriod('P7D');  // "7 days"

// Get best package from offering (prefers annual > monthly > weekly)
const bestPackage = getBestPackage(offering);`}
            />
          </div>

          {/* Error Handling */}
          <h2 className="mt-12">Error Handling</h2>

          <div className="not-prose">
            <CodeBlock
              code={`import { CroissantPayError } from '@croissantpay/react-native';

async function handlePurchase(productId: string) {
  const result = await purchase(productId);

  if (!result.success && result.error) {
    const error = CroissantPayError.fromPurchaseError(result.error);

    if (error.isCancelled) {
      // User cancelled - don't show error
      return;
    }

    if (error.isPending) {
      // Purchase pending (e.g., parental approval)
      showPendingMessage();
      return;
    }

    if (error.isNetworkError) {
      showNetworkError();
      return;
    }

    // Show generic error
    showError(error.message);
  }
}`}
            />
          </div>

          {/* Next Steps */}
          <h2 className="mt-12">Next Steps</h2>

          <div className="not-prose grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/sdk/ios-setup"
              className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
            >
              <h4 className="font-semibold group-hover:text-primary transition-colors">
                iOS Setup →
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Configure StoreKit 2 and App Store Connect
              </p>
            </Link>
            <Link
              href="/docs/sdk/android-setup"
              className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
            >
              <h4 className="font-semibold group-hover:text-primary transition-colors">
                Android Setup →
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Configure Google Play Billing
              </p>
            </Link>
            <Link
              href="/docs/webhooks"
              className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
            >
              <h4 className="font-semibold group-hover:text-primary transition-colors">
                Webhooks →
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Receive real-time subscription events
              </p>
            </Link>
            <Link
              href="/docs/features/entitlements"
              className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
            >
              <h4 className="font-semibold group-hover:text-primary transition-colors">
                Entitlements →
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage access control for features
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center gap-2">
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">{title}</span>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodDoc({
  name,
  returns,
  description,
}: {
  name: string;
  returns: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border">
      <div className="flex items-start justify-between gap-4">
        <code className="text-primary font-semibold">{name}</code>
        <code className="text-muted-foreground text-xs">{returns}</code>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}

