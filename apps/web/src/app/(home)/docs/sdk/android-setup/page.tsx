import Link from "next/link";
import { Smartphone, PlayCircle, CheckCircle, AlertTriangle } from "lucide-react";

export default function AndroidSetupPage() {
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
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Android Setup</h1>
            <p className="text-muted-foreground">Configure Google Play Billing v6</p>
          </div>
        </div>

        {/* Prerequisites */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Google Play Developer account ($25 one-time fee)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Android Studio or VS Code with React Native setup</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>minSdkVersion 24 or higher</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>React Native 0.70+</span>
            </li>
          </ul>
        </section>

        {/* Step 1: Google Play Console */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 1: Create Your App in Google Play Console</h2>
          <ol className="space-y-4 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Google Play Console</span>
              <p className="ml-6 mt-1">Visit <a href="https://play.google.com/console" className="text-primary hover:underline" target="_blank">play.google.com/console</a> and sign in</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a new app</span>
              <p className="ml-6 mt-1">Click "Create app" and fill in the required details</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Set up your app</span>
              <p className="ml-6 mt-1">Complete the app content questionnaire and store listing</p>
            </li>
          </ol>
        </section>

        {/* Step 2: Create Products */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 2: Create In-App Products</h2>
          
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Important</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You must upload at least one APK/AAB to create in-app products. You can use internal testing track.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3">For Subscriptions:</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to Subscriptions</span>
              <p className="ml-6 mt-1">Go to "Monetize" → "Products" → "Subscriptions"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a subscription</span>
              <p className="ml-6 mt-1">Click "Create subscription" and enter a Product ID</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add base plans</span>
              <p className="ml-6 mt-1">Configure pricing, billing period, and grace period for each plan</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add offers (optional)</span>
              <p className="ml-6 mt-1">Create free trials, introductory pricing, or upgrade/downgrade offers</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">For One-Time Products:</h3>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Navigate to In-app products</span>
              <p className="ml-6 mt-1">Go to "Monetize" → "Products" → "In-app products"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create the product</span>
              <p className="ml-6 mt-1">Enter Product ID, name, description, and price</p>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold mb-2">Product ID Naming Convention</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Google recommends lowercase with underscores:
            </p>
            <code className="block p-3 rounded-lg bg-secondary text-sm">
              premium_monthly
            </code>
            <p className="text-sm text-muted-foreground mt-2">
              Unlike iOS, Google Play product IDs cannot contain dots.
            </p>
          </div>
        </section>

        {/* Step 3: Real-time Developer Notifications */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 3: Set Up Real-time Developer Notifications (RTDN)</h2>
          <p className="text-muted-foreground mb-4">
            Google Play sends real-time notifications about subscription events via Cloud Pub/Sub.
          </p>
          
          <h3 className="text-lg font-semibold mb-3">Create a Pub/Sub Topic</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Google Cloud Console</span>
              <p className="ml-6 mt-1">Visit <a href="https://console.cloud.google.com" className="text-primary hover:underline" target="_blank">console.cloud.google.com</a></p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Enable Pub/Sub API</span>
              <p className="ml-6 mt-1">Search for "Pub/Sub" and enable the API</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a topic</span>
              <p className="ml-6 mt-1">Name it something like "play-billing-notifications"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a push subscription</span>
              <div className="ml-6 mt-2">
                <p className="text-sm mb-2">Endpoint URL:</p>
                <code className="block p-3 rounded-lg bg-secondary text-sm">
                  https://api.croissantpay.dev/api/webhooks/google
                </code>
              </div>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">Configure in Play Console</h3>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Monetization setup</span>
              <p className="ml-6 mt-1">In Play Console, navigate to "Monetization setup"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Enter your topic name</span>
              <p className="ml-6 mt-1">Format: projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC_NAME</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Grant publisher permission</span>
              <p className="ml-6 mt-1">Add google-play-developer-notifications@system.gserviceaccount.com as a publisher to your topic</p>
            </li>
          </ol>
        </section>

        {/* Step 4: Service Account */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 4: Create a Service Account</h2>
          <p className="text-muted-foreground mb-4">
            A service account allows CroissantPay to verify purchases with Google Play.
          </p>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Go to Google Cloud Console</span>
              <p className="ml-6 mt-1">Navigate to IAM & Admin → Service Accounts</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create a service account</span>
              <p className="ml-6 mt-1">Name it something like "croissantpay-billing"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Create and download a key</span>
              <p className="ml-6 mt-1">Select JSON format and save the file securely</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Link to Play Console</span>
              <p className="ml-6 mt-1">In Play Console, go to "Users & permissions" → "Invite new users"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Grant permissions</span>
              <p className="ml-6 mt-1">Add the service account email with "View financial data" and "Manage orders" permissions</p>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">Keep your service account key secure</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Never commit this file to version control. Store it securely and only use it in your server configuration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5: Native Configuration */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Step 5: Configure Your Android Project</h2>
          
          <h3 className="text-lg font-semibold mb-3">Add Billing Permission</h3>
          <p className="text-muted-foreground mb-3">
            In your AndroidManifest.xml, add the billing permission:
          </p>
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">android/app/src/main/AndroidManifest.xml</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`<manifest ...>
    <uses-permission android:name="com.android.vending.BILLING" />
    ...
</manifest>`}</code>
            </pre>
          </div>

          <h3 className="text-lg font-semibold mb-3">Verify Gradle Configuration</h3>
          <p className="text-muted-foreground mb-3">
            Ensure your build.gradle has the correct minSdkVersion:
          </p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-sm text-muted-foreground">android/app/build.gradle</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code>{`android {
    defaultConfig {
        minSdkVersion 24  // Required for Billing Library v6
        ...
    }
}`}</code>
            </pre>
          </div>
        </section>

        {/* Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Testing In-App Purchases</h2>
          
          <h3 className="text-lg font-semibold mb-3">License Testing</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add license testers</span>
              <p className="ml-6 mt-1">In Play Console, go to "Setup" → "License testing"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add test account emails</span>
              <p className="ml-6 mt-1">These accounts can make test purchases without being charged</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Set license response</span>
              <p className="ml-6 mt-1">Choose "RESPOND_NORMALLY" for realistic testing</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold mb-3">Internal Testing Track</h3>
          <ol className="space-y-3 list-decimal list-inside mb-6">
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Upload an AAB to internal testing</span>
              <p className="ml-6 mt-1">Go to "Testing" → "Internal testing" → "Create new release"</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Add testers</span>
              <p className="ml-6 mt-1">Create an email list and add your test accounts</p>
            </li>
            <li className="text-muted-foreground">
              <span className="text-foreground font-medium">Share the opt-in link</span>
              <p className="ml-6 mt-1">Testers must opt-in before they can download the test version</p>
            </li>
          </ol>

          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold mb-2">Test Subscription Periods</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Unlike iOS, Google Play uses shortened renewal periods for testing:
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Production Duration</th>
                  <th className="text-left py-2">Test Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2">1 week</td>
                  <td className="py-2">5 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">1 month</td>
                  <td className="py-2">5 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">3 months</td>
                  <td className="py-2">10 minutes</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2">6 months</td>
                  <td className="py-2">15 minutes</td>
                </tr>
                <tr>
                  <td className="py-2">1 year</td>
                  <td className="py-2">30 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Common Issues</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">"Item not available for purchase"</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Ensure your app is uploaded to at least internal testing track</li>
                <li>• Check that the product is active in Play Console</li>
                <li>• Verify the package name matches exactly</li>
                <li>• Wait 24-48 hours after creating products</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-2">"This version of the app is not configured for billing"</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• The signed version must be uploaded to Play Console</li>
                <li>• Test on a release build, not debug</li>
                <li>• Ensure the user is signed in with a Google account</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/sdk/ios-setup"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <span className="font-medium">iOS Setup →</span>
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



