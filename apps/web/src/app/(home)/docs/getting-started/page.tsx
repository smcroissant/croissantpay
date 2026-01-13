import Link from "next/link";
import {
  Smartphone,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  Settings,
  Code,
  Zap,
} from "lucide-react";

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-medium">
              Docs
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              All Docs
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <span>/</span>
          <span className="text-foreground">Getting Started</span>
        </nav>

        <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Get CroissantPay running in your React Native app in just 5 minutes.
        </p>

        {/* Step 1 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              1
            </div>
            <h2 className="text-2xl font-bold">Create your account</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Sign up for a free CroissantPay account to get your API keys.
          </p>
          <div className="pl-11">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
            >
              Create Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Step 2 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              2
            </div>
            <h2 className="text-2xl font-bold">Install the SDK</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Add the CroissantPay SDK to your React Native project.
          </p>
          <div className="pl-11">
            <CodeBlock
              language="bash"
              code={`# npm
npm install @croissantpay/react-native

# yarn
yarn add @croissantpay/react-native

# pnpm
pnpm add @croissantpay/react-native`}
            />
          </div>
        </section>

        {/* Step 3 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              3
            </div>
            <h2 className="text-2xl font-bold">Configure your app</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Create an app in the CroissantPay dashboard and add your store credentials.
          </p>
          <div className="pl-11 space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                For iOS (App Store)
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Create an API key in App Store Connect (Users → Keys)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Add your Issuer ID and Key ID to CroissantPay
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Upload the .p8 private key file
                </li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                For Android (Google Play)
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Create a service account in Google Cloud Console
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Grant access in Play Console (Users → Permissions)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Upload the service account JSON to CroissantPay
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              4
            </div>
            <h2 className="text-2xl font-bold">Initialize the SDK</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Wrap your app with the CroissantPay provider and start using purchases.
          </p>
          <div className="pl-11">
            <CodeBlock
              language="tsx"
              code={`import { CroissantPayProvider } from '@croissantpay/react-native';

function App() {
  return (
    <CroissantPayProvider 
      apiKey="mx_public_your_key_here"
      userId={currentUser.id} // Your app's user ID
      apiUrl="https://api.croissantpay.dev" // Or your self-hosted URL
    >
      <YourApp />
    </CroissantPayProvider>
  );
}`}
            />
          </div>
        </section>

        {/* Step 5 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              5
            </div>
            <h2 className="text-2xl font-bold">Display products and purchase</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Use the usePurchases hook to display products and handle purchases.
          </p>
          <div className="pl-11">
            <CodeBlock
              language="tsx"
              code={`import { usePurchases } from '@croissantpay/react-native';

function PaywallScreen() {
  const { 
    offerings,
    purchaseProduct,
    hasEntitlement,
    isLoading 
  } = usePurchases();

  // Check if user already has access
  if (hasEntitlement('premium')) {
    return <Text>You're already a premium member!</Text>;
  }

  // Show loading state
  if (isLoading || !offerings) {
    return <ActivityIndicator />;
  }

  // Get current offering packages
  const packages = offerings.current?.packages || [];

  return (
    <View>
      <Text>Choose your plan</Text>
      {packages.map(pkg => (
        <TouchableOpacity
          key={pkg.identifier}
          onPress={() => purchaseProduct(pkg.product)}
        >
          <Text>{pkg.product.title}</Text>
          <Text>{pkg.product.priceString}</Text>
          <Text>{pkg.product.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}`}
            />
          </div>
        </section>

        {/* Step 6 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              6
            </div>
            <h2 className="text-2xl font-bold">Check entitlements</h2>
          </div>
          <p className="text-muted-foreground mb-4 pl-11">
            Gate features based on what the user has purchased.
          </p>
          <div className="pl-11">
            <CodeBlock
              language="tsx"
              code={`import { usePurchases } from '@croissantpay/react-native';

function PremiumFeature() {
  const { hasEntitlement, entitlements } = usePurchases();

  // Simple check
  if (!hasEntitlement('premium')) {
    return <UpgradePrompt />;
  }

  // Or get full entitlement details
  const premium = entitlements?.premium;
  
  return (
    <View>
      <Text>Welcome, premium member!</Text>
      {premium?.expiresAt && (
        <Text>Renews: {new Date(premium.expiresAt).toLocaleDateString()}</Text>
      )}
      <PremiumContent />
    </View>
  );
}`}
            />
          </div>
        </section>

        {/* Success Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">You're all set!</h3>
              <p className="text-muted-foreground">
                CroissantPay will automatically validate receipts, track subscriptions,
                and keep entitlements in sync across devices. Check the dashboard
                to monitor your subscribers and revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <Link
            href="/docs"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Docs
          </Link>
          <Link
            href="/docs/sdk/react-native"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            SDK Reference
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase">{language}</span>
        <button className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground">
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-foreground">{code}</code>
      </pre>
    </div>
  );
}

