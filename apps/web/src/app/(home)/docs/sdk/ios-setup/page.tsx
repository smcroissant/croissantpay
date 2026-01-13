import Link from "next/link";
import { Smartphone, Apple, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

export default function IosSetupPage() {
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
            <Apple className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">iOS Setup</h1>
            <p className="text-muted-foreground">Configure StoreKit 2 and App Store Connect</p>
          </div>
        </div>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Apple Developer Program membership ($99/year)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Xcode 14 or later</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>iOS 15.0+ deployment target (for StoreKit 2)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>React Native 0.70+</span>
            </li>
          </ul>
        </section>

        {/* Step 1: App Store Connect */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 1: Create Your App in App Store Connect</h2>
          <ol className="space-y-4 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to App Store Connect</span>
              <p className="ml-6 mt-1">Visit <a href="https://appstoreconnect.apple.com" className="text-primary hover:underline" target="_blank">appstoreconnect.apple.com</a> and sign in</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a new app</span>
              <p className="ml-6 mt-1">Click "My Apps" → "+" → "New App"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Fill in app details</span>
              <p className="ml-6 mt-1">Enter name, primary language, bundle ID, and SKU</p>
            </li>
          </ol>
        </section>

        {/* Step 2: Create Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 2: Create In-App Purchase Products</h2>
          
          <h3 className="text-lg font-semibold mb-3">For Subscriptions:</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to Subscriptions</span>
              <p className="ml-6 mt-1">In your app, go to "Features" → "Subscriptions"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a Subscription Group</span>
              <p className="ml-6 mt-1">Click "+" to create a new subscription group (e.g., "Premium")</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add subscriptions to the group</span>
              <p className="ml-6 mt-1">Create individual subscription products (monthly, yearly, etc.)</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">For One-Time Purchases:</h3>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to In-App Purchases</span>
              <p className="ml-6 mt-1">Go to "Features" → "In-App Purchases"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create the product</span>
              <p className="ml-6 mt-1">Select type: Consumable, Non-Consumable, or Non-Renewing Subscription</p>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold mb-2">Product ID Naming Convention</h4>
            <p className="text-sm text-muted-foreground mb-2">
              We recommend using a consistent naming convention:
            </p>
            <code className="block p-3 rounded-lg bg-secondary text-sm">
              com.yourcompany.appname.product_type_duration
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Example: <code className="px-1 py-0.5 rounded bg-secondary">com.acme.myapp.premium_monthly</code>
            </p>
          </div>
        </section>

        {/* Step 3: Configure Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 3: Configure Pricing</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Select price tier</span>
              <p className="ml-6 mt-1">Apple uses price tiers. Select the appropriate tier for your product.</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Set availability</span>
              <p className="ml-6 mt-1">Choose which countries/regions the product is available in.</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Configure introductory offers (optional)</span>
              <p className="ml-6 mt-1">Set up free trials, pay-as-you-go, or pay-up-front offers.</p>
            </li>
          </ol>
        </section>

        {/* Step 4: App Store Server Notifications */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 4: Set Up Server Notifications</h2>
          <p className="text-muted-foreground mb-4">
            Configure App Store Server Notifications to receive real-time updates about subscription events.
          </p>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to App Information</span>
              <p className="ml-6 mt-1">In App Store Connect, navigate to "General" → "App Information"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Find "App Store Server Notifications"</span>
              <p className="ml-6 mt-1">Scroll down to the notifications section</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Enter your webhook URL</span>
              <div className="ml-6 mt-2">
                <code className="block p-3 rounded-lg bg-secondary text-sm">
                  https://api.croissantpay.dev/api/webhooks/apple
                </code>
                <p className="text-sm text-muted-foreground mt-2">
                  For self-hosted: <code className="px-1 py-0.5 rounded bg-secondary">https://your-domain.com/api/webhooks/apple</code>
                </p>
              </div>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Select Version 2</span>
              <p className="ml-6 mt-1">Choose "Version 2 Notifications" for the best compatibility</p>
            </li>
          </ol>
        </section>

        {/* Step 5: Shared Secret */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 5: Get Your Shared Secret</h2>
          <p className="text-muted-foreground mb-4">
            The shared secret is used to validate receipts server-side.
          </p>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to Shared Secret</span>
              <p className="ml-6 mt-1">In App Store Connect, go to "General" → "Shared Secret"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Generate or copy your secret</span>
              <p className="ml-6 mt-1">Click "Generate" if you don't have one, or copy the existing secret</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add to CroissantPay</span>
              <p className="ml-6 mt-1">In your app settings, paste the shared secret in the Apple configuration section</p>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Keep your shared secret secure</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Never expose this in your client-side code. Only use it on your server or in CroissantPay configuration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 6: Native Configuration */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 6: Configure Your Xcode Project</h2>
          
          <h3 className="text-lg font-semibold mb-3">Enable In-App Purchase Capability</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Open your project in Xcode</span>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Select your target</span>
              <p className="ml-6 mt-1">Click on your app target in the project navigator</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Signing & Capabilities</span>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add In-App Purchase capability</span>
              <p className="ml-6 mt-1">Click "+ Capability" and search for "In-App Purchase"</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">Install the SDK Pod</h3>
          <p className="text-muted-foreground mb-3">
            After installing the npm package, run pod install:
          </p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">Terminal</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`cd ios && pod install`}</code>
            </pre>
          </div>
        </section>

        {/* Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Testing In-App Purchases</h2>
          
          <h3 className="text-lg font-semibold mb-3">Sandbox Testing</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a Sandbox tester account</span>
              <p className="ml-6 mt-1">In App Store Connect, go to "Users and Access" → "Sandbox Testers"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Sign out of App Store on device</span>
              <p className="ml-6 mt-1">Settings → iTunes & App Store → Sign Out</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Test purchases in your app</span>
              <p className="ml-6 mt-1">When prompted, sign in with your sandbox account</p>
            </li>
          </ol>

          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold mb-2">Sandbox Subscription Durations</h4>
            <p className="text-sm text-muted-foreground mb-3">
              In sandbox, subscriptions renew faster for testing:
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Production Duration</th>
                  <th className="text-left py-2">Sandbox Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2">1 week</td>
                  <td className="py-2">3 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">1 month</td>
                  <td className="py-2">5 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">2 months</td>
                  <td className="py-2">10 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">3 months</td>
                  <td className="py-2">15 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">6 months</td>
                  <td className="py-2">30 minutes</td>
                </tr>
                <tr>
                  <td className="py-2">1 year</td>
                  <td className="py-2">1 hour</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/sdk/android-setup"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">Android Setup →</span>
            </Link>
            <Link
              href="/docs/sdk/react-native"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">SDK Integration →</span>
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



