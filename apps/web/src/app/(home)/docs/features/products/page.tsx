import Link from "next/link";
import { Smartphone, Package, CheckCircle, ArrowRight, Layers, Tag } from "lucide-react";

export default function ProductsPage() {
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
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Products & Offerings</h1>
            <p className="text-muted-foreground">Configure what you sell and how you display it</p>
          </div>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-muted-foreground mb-4">
            CroissantPay uses three concepts to organize your in-app purchases:
          </p>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Products</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Products are the actual items you sell—subscriptions, one-time purchases, or consumables. 
                Each product maps to a product in the App Store and/or Google Play.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Offerings</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Offerings are curated collections of products to display on your paywall. 
                You can have multiple offerings for different scenarios (default, sale, experiment).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Packages</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Packages are products within an offering, with a specific type (monthly, annual, lifetime, etc.) 
                that helps you identify them in your UI.
              </p>
            </div>
          </div>
        </section>

        {/* Hierarchy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Hierarchy</h2>
          <div className="p-6 rounded-xl bg-card border border-border">
            <pre className="text-sm overflow-x-auto">
{`Offerings
├── "default" (current offering)
│   ├── Package: MONTHLY
│   │   └── Product: Premium Monthly ($9.99/mo)
│   ├── Package: ANNUAL
│   │   └── Product: Premium Annual ($79.99/yr)
│   └── Package: LIFETIME
│       └── Product: Premium Lifetime ($199.99)
│
└── "sale_offering" 
    ├── Package: MONTHLY
    │   └── Product: Premium Monthly ($7.99/mo)  [sale price]
    └── Package: ANNUAL
        └── Product: Premium Annual ($59.99/yr) [sale price]`}
            </pre>
          </div>
        </section>

        {/* Product Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Product Types</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">Auto-Renewable Subscriptions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Automatically renew until cancelled. Best for ongoing access to features or content.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Weekly, monthly, quarterly, annual, etc.</li>
                <li>• Support free trials and introductory pricing</li>
                <li>• Grace periods for failed payments</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">Non-Consumable (Lifetime)</h3>
              <p className="text-sm text-muted-foreground mb-2">
                One-time purchase that doesn't expire. Best for permanent unlocks.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Permanent access to features</li>
                <li>• Restored on reinstall/new devices</li>
                <li>• No renewal or expiration</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">Consumables</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Can be purchased multiple times and used up. Best for virtual currency or credits.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Coins, gems, credits, etc.</li>
                <li>• Not restored on reinstall</li>
                <li>• Track balance in your backend</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Creating Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Creating Products</h2>
          
          <h3 className="text-lg font-semibold mb-3">Step 1: Create in App Stores</h3>
          <p className="text-muted-foreground mb-4">
            First, create your products in App Store Connect and Google Play Console. 
            See our <Link href="/docs/sdk/ios-setup" className="text-primary hover:underline">iOS Setup</Link> and{" "}
            <Link href="/docs/sdk/android-setup" className="text-primary hover:underline">Android Setup</Link> guides.
          </p>

          <h3 className="text-lg font-semibold mb-3">Step 2: Add to CroissantPay</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Products in the dashboard</span>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Click "Create Product"</span>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Enter product details:</span>
              <ul className="ml-6 mt-2 space-y-1">
                <li>• Identifier (e.g., "premium_monthly")</li>
                <li>• Display name</li>
                <li>• Product type</li>
                <li>• App Store product ID</li>
                <li>• Google Play product ID</li>
              </ul>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Link entitlements this product grants</span>
            </li>
          </ol>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Create via API</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`POST /api/v1/products
{
  "identifier": "premium_monthly",
  "displayName": "Premium Monthly",
  "description": "Full premium access, billed monthly",
  "type": "subscription",
  "storeProductIdApple": "com.myapp.premium_monthly",
  "storeProductIdGoogle": "premium_monthly",
  "entitlementIds": ["premium"]
}`}</code>
            </pre>
          </div>
        </section>

        {/* Creating Offerings */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Creating Offerings</h2>
          <p className="text-muted-foreground mb-4">
            Offerings let you control which products appear on your paywall without app updates.
          </p>

          <h3 className="text-lg font-semibold mb-3">Default Offering</h3>
          <p className="text-muted-foreground mb-4">
            Your app always has a "current" offering that's returned by default. This is 
            typically your main paywall configuration.
          </p>

          <h3 className="text-lg font-semibold mb-3">Multiple Offerings</h3>
          <p className="text-muted-foreground mb-4">
            Create additional offerings for:
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>Sales:</strong> Special pricing during promotions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>A/B Tests:</strong> Different product combinations to test</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>User Segments:</strong> Different offerings for different users</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span><strong>Win-back:</strong> Special offers for churned users</span>
            </li>
          </ul>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Create offering via API</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`POST /api/v1/offerings
{
  "identifier": "default",
  "displayName": "Default Offering",
  "isCurrent": true,
  "packages": [
    {
      "productId": "prod_monthly",
      "packageType": "MONTHLY"
    },
    {
      "productId": "prod_annual", 
      "packageType": "ANNUAL"
    }
  ]
}`}</code>
            </pre>
          </div>
        </section>

        {/* Package Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Package Types</h2>
          <p className="text-muted-foreground mb-4">
            Package types help you identify products in your UI without hardcoding identifiers:
          </p>
          
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3"><code>WEEKLY</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Weekly subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>MONTHLY</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Monthly subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>TWO_MONTH</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Every 2 months</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>THREE_MONTH</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Quarterly subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>SIX_MONTH</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Semi-annual subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>ANNUAL</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Yearly subscription</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>LIFETIME</code></td>
                  <td className="px-4 py-3 text-muted-foreground">One-time lifetime purchase</td>
                </tr>
                <tr>
                  <td className="px-4 py-3"><code>CUSTOM</code></td>
                  <td className="px-4 py-3 text-muted-foreground">Custom/other package type</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Using in Your App */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Using Offerings in Your App</h2>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Paywall.tsx</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`import { usePurchases } from '@croissantpay/react-native';

function Paywall() {
  const { offerings, purchaseProduct, isLoading } = usePurchases();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const currentOffering = offerings?.current;
  
  if (!currentOffering) {
    return <Text>No products available</Text>;
  }
  
  return (
    <View>
      <Text>Choose your plan</Text>
      
      {currentOffering.packages.map(pkg => (
        <TouchableOpacity
          key={pkg.id}
          onPress={() => purchaseProduct(pkg.product)}
        >
          <View style={styles.planCard}>
            <Text style={styles.planName}>
              {pkg.product.title}
            </Text>
            <Text style={styles.price}>
              {pkg.product.priceString}
              {pkg.packageType === 'ANNUAL' && '/year'}
              {pkg.packageType === 'MONTHLY' && '/month'}
            </Text>
            {pkg.packageType === 'ANNUAL' && (
              <Text style={styles.savings}>
                Save 33%
              </Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}`}</code>
            </pre>
          </div>

          <h3 className="text-lg font-semibold mb-3">Accessing Specific Packages</h3>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Package shortcuts</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`const currentOffering = offerings?.current;

// Access packages by type
const monthlyPkg = currentOffering?.monthly;
const annualPkg = currentOffering?.annual;
const lifetimePkg = currentOffering?.lifetime;

// Or filter from packages array
const monthly = currentOffering?.packages.find(
  pkg => pkg.packageType === 'MONTHLY'
);`}</code>
            </pre>
          </div>
        </section>

        {/* Best Practices */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Match product IDs between stores
              </h3>
              <p className="text-sm text-muted-foreground">
                Use similar identifiers for the same product across platforms to make management easier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Include annual options
              </h3>
              <p className="text-sm text-muted-foreground">
                Annual subscriptions typically have higher LTV and lower churn. 
                Always offer an annual option with a discount.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Use offerings for remote control
              </h3>
              <p className="text-sm text-muted-foreground">
                Instead of hardcoding products, use offerings to control your paywall remotely. 
                This lets you run sales or tests without app updates.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Handle missing products gracefully
              </h3>
              <p className="text-sm text-muted-foreground">
                Always check if offerings and products exist before rendering. 
                Products might not be available in all regions.
              </p>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/entitlements"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">Entitlements →</span>
            </Link>
            <Link
              href="/docs/webhooks"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">Webhooks →</span>
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



