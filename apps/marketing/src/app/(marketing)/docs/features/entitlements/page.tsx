import Link from "next/link";
import { Smartphone, Shield, CheckCircle, Lock, Unlock, ArrowRight } from "lucide-react";

export default function EntitlementsPage() {
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
              ← Back to Docs
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Entitlements</h1>
            <p className="text-muted-foreground">Control access to features with entitlements</p>
          </div>
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What are Entitlements?</h2>
          <p className="text-muted-foreground mb-4">
            Entitlements represent the features or content that users can unlock through purchases. 
            Instead of checking for specific product purchases, you check if a user has a specific 
            entitlement. This abstraction provides several benefits:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Change products without updating app code</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Multiple products can grant the same entitlement</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Grant entitlements manually for promotions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cleaner code focused on features, not products</span>
            </li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How Entitlements Work</h2>
          <div className="p-6 rounded-xl bg-card border border-border mb-6">
            <pre className="text-sm overflow-x-auto">
{`┌─────────────────────────────────────────────────────────┐
│                      Products                            │
├─────────────────┬─────────────────┬─────────────────────┤
│ Monthly Premium │ Annual Premium  │ Lifetime Premium    │
│    $9.99/mo     │    $79.99/yr    │      $199.99        │
└────────┬────────┴────────┬────────┴──────────┬──────────┘
         │                 │                   │
         │   All grant:    │                   │
         ▼                 ▼                   ▼
         ┌─────────────────────────────────────┐
         │         "premium" entitlement        │
         └─────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │   hasEntitlement('premium') = true   │
         │                                     │
         │   • Ad-free experience              │
         │   • Exclusive content               │
         │   • Advanced features               │
         └─────────────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Creating Entitlements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Creating Entitlements</h2>
          
          <h3 className="text-lg font-semibold mb-3">In the Dashboard</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to Products</span>
              <p className="ml-6 mt-1">Go to your app's Products section in the dashboard</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Click "Create Entitlement"</span>
              <p className="ml-6 mt-1">Find the Entitlements tab and create a new one</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Set the identifier</span>
              <p className="ml-6 mt-1">Use a simple, descriptive identifier like "premium" or "pro_features"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add display name and description</span>
              <p className="ml-6 mt-1">These are for your reference in the dashboard</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">Via API</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Create entitlement via API</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`POST /api/v1/entitlements
{
  "identifier": "premium",
  "displayName": "Premium Access",
  "description": "Full access to all premium features"
}`}</code>
            </pre>
          </div>
        </section>

        {/* Linking to Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Linking Entitlements to Products</h2>
          <p className="text-muted-foreground mb-4">
            Each product can grant one or more entitlements when purchased. When a user purchases 
            the product, they automatically receive all linked entitlements.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="font-semibold mb-2">Example: Simple App</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monthly Premium ($9.99/mo)</span>
                  <span>→ grants "premium"</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Annual Premium ($79.99/yr)</span>
                  <span>→ grants "premium"</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h4 className="font-semibold mb-2">Example: Multi-Tier App</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plus Subscription</span>
                  <span>→ grants "plus"</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pro Subscription</span>
                  <span>→ grants "plus", "pro"</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Enterprise Subscription</span>
                  <span>→ grants "plus", "pro", "enterprise"</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Checking Entitlements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Checking Entitlements in Your App</h2>
          
          <h3 className="text-lg font-semibold mb-3">Using the SDK</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">React Native</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`import { usePurchases } from '@croissantpay/react-native';

function MyComponent() {
  const { hasEntitlement, entitlements } = usePurchases();
  
  // Simple check
  const isPremium = hasEntitlement('premium');
  
  // Check with details
  const premiumEntitlement = entitlements['premium'];
  if (premiumEntitlement?.isActive) {
    console.log('Expires:', premiumEntitlement.expiresAt);
    console.log('From product:', premiumEntitlement.productId);
  }
  
  return (
    <View>
      {isPremium ? (
        <PremiumContent />
      ) : (
        <UpgradePrompt />
      )}
    </View>
  );
}`}</code>
            </pre>
          </div>

          <h3 className="text-lg font-semibold mb-3">Server-Side Check</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">API Request</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`GET /api/v1/subscribers/user_123/entitlements
Authorization: X-API-Key: mx_live_xxx

// Response
{
  "entitlements": {
    "premium": {
      "isActive": true,
      "expiresAt": "2024-02-15T00:00:00Z",
      "productId": "com.app.premium_monthly",
      "purchaseDate": "2024-01-15T00:00:00Z"
    }
  }
}`}</code>
            </pre>
          </div>
        </section>

        {/* Manual Grants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Granting Entitlements Manually</h2>
          <p className="text-muted-foreground mb-4">
            Sometimes you need to grant entitlements without a purchase—for promotions, 
            customer support, or testing.
          </p>

          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Grant via API</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`POST /api/v1/entitlements/grant
{
  "appUserId": "user_123",
  "entitlementId": "premium",
  "expiresAt": "2024-12-31T23:59:59Z",  // Optional, omit for permanent
  "reason": "Customer support compensation"
}`}</code>
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Note:</strong> Manually granted entitlements are marked as such in the 
              subscriber record, so you can distinguish them from purchase-based entitlements.
            </p>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Use descriptive identifiers
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose identifiers that describe the feature, not the product. 
                "premium_features" is better than "monthly_subscription".
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Plan for growth
              </h3>
              <p className="text-sm text-muted-foreground">
                Create entitlements for feature groups you might separate later. 
                It's easier to merge than to split.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Cache entitlements client-side
              </h3>
              <p className="text-sm text-muted-foreground">
                The SDK caches entitlements automatically. Only refresh when needed 
                (app launch, after purchase, pull-to-refresh).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Verify server-side for sensitive operations
              </h3>
              <p className="text-sm text-muted-foreground">
                For actions with real consequences (unlocking content, accessing APIs), 
                verify entitlements server-side as well.
              </p>
            </div>
          </div>
        </section>

        {/* Example Implementation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Example: Feature Gating Pattern</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">FeatureGate.tsx</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`import { usePurchases } from '@croissantpay/react-native';
import { useNavigation } from '@react-navigation/native';

interface FeatureGateProps {
  entitlement: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ 
  entitlement, 
  children, 
  fallback 
}: FeatureGateProps) {
  const { hasEntitlement } = usePurchases();
  const navigation = useNavigation();
  
  if (hasEntitlement(entitlement)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <View style={styles.locked}>
      <Lock size={24} />
      <Text>This feature requires {entitlement}</Text>
      <Button 
        title="Upgrade" 
        onPress={() => navigation.navigate('Paywall')} 
      />
    </View>
  );
}

// Usage
<FeatureGate entitlement="premium">
  <AdvancedAnalytics />
</FeatureGate>

<FeatureGate 
  entitlement="pro" 
  fallback={<BasicExport />}
>
  <AdvancedExport />
</FeatureGate>`}</code>
            </pre>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/products"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">Products & Offerings →</span>
            </Link>
            <Link
              href="/docs/api"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">API Reference →</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">CroissantPay</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 CroissantPay. MIT License.
          </p>
        </div>
      </footer>
    </div>
  );
}



