import Link from "next/link";
import { headers } from "next/headers";
import {
  Smartphone,
  Book,
  Code,
  Server,
  Webhook,
  Terminal,
  Settings,
  Apple,
  PlayCircle,
  ArrowRight,
  FileCode,
  Zap,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { auth } from "@/lib/auth";

export default async function DocsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
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
              href="/pricing"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Everything you need to integrate in-app purchases into your React Native apps
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/docs/getting-started"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
            >
              <Zap className="w-5 h-5" />
              Quick Start
            </Link>
            <Link
              href="/docs/api"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold"
            >
              <FileCode className="w-5 h-5" />
              API Reference
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Getting Started</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocCard
              icon={<Book className="w-6 h-6" />}
              title="Introduction"
              description="Learn what CroissantPay is and how it helps you manage in-app purchases"
              href="/docs/introduction"
            />
            <DocCard
              icon={<Terminal className="w-6 h-6" />}
              title="Quick Start"
              description="Get up and running in 5 minutes with our step-by-step guide"
              href="/docs/getting-started"
            />
            <DocCard
              icon={<Server className="w-6 h-6" />}
              title="Self-Hosting"
              description="Deploy CroissantPay on your own infrastructure with Docker"
              href="/docs/self-hosted"
            />
          </div>
        </div>
      </section>

      {/* SDK Section */}
      <section className="py-16 px-6 bg-card/50 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">SDK Integration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocCard
              icon={<Code className="w-6 h-6" />}
              title="React Native SDK"
              description="Install and configure the React Native SDK in your app"
              href="/docs/sdk/react-native"
            />
            <DocCard
              icon={<Apple className="w-6 h-6" />}
              title="iOS Setup"
              description="Configure StoreKit 2 and App Store Connect for iOS purchases"
              href="/docs/sdk/ios-setup"
            />
            <DocCard
              icon={<PlayCircle className="w-6 h-6" />}
              title="Android Setup"
              description="Configure Google Play Billing and Play Console for Android"
              href="/docs/sdk/android-setup"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocCard
              icon={<Shield className="w-6 h-6" />}
              title="Entitlements"
              description="Define and manage what users get access to with their purchases"
              href="/docs/features/entitlements"
            />
            <DocCard
              icon={<Webhook className="w-6 h-6" />}
              title="Webhooks"
              description="Receive real-time notifications for subscription events"
              href="/docs/webhooks"
            />
            <DocCard
              icon={<Settings className="w-6 h-6" />}
              title="Product Setup"
              description="Configure products, offerings, and pricing for your apps"
              href="/docs/features/products"
            />
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-16 px-6 bg-card/50 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">API Reference</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ApiLink href="/docs/api/receipts" title="Receipts" />
            <ApiLink href="/docs/api/subscribers" title="Subscribers" />
            <ApiLink href="/docs/api/entitlements" title="Entitlements" />
            <ApiLink href="/docs/api/offerings" title="Offerings" />
            <ApiLink href="/docs/api/products" title="Products" />
            <ApiLink href="/docs/api/apps" title="Apps" />
            <ApiLink href="/docs/api/webhooks" title="Webhooks" />
            <ApiLink href="/docs/api/errors" title="Error Codes" />
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Quick Example</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-muted-foreground">App.tsx</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm">
              <code className="text-foreground">{`import { CroissantPayProvider, usePurchases } from '@croissantpay/react-native';

function App() {
  return (
    <CroissantPayProvider 
      apiKey="mx_public_your_key"
      userId={userId}
    >
      <SubscriptionScreen />
    </CroissantPayProvider>
  );
}

function SubscriptionScreen() {
  const { 
    offerings, 
    purchaseProduct, 
    hasEntitlement 
  } = usePurchases();

  const isPro = hasEntitlement('pro');

  if (isPro) {
    return <ProContent />;
  }

  return (
    <View>
      {offerings?.current?.packages.map(pkg => (
        <Button
          key={pkg.id}
          title={\`Subscribe for \${pkg.product.priceString}\`}
          onPress={() => purchaseProduct(pkg.product)}
        />
      ))}
    </View>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </section>

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

function DocCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Link>
  );
}

function ApiLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors group"
    >
      <span className="font-medium">{title}</span>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

