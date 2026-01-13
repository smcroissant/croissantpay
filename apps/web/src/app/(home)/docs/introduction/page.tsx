import Link from "next/link";
import {
  Smartphone,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  Server,
  CreditCard,
  BarChart3,
  Users,
} from "lucide-react";

export default function IntroductionPage() {
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
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">Introduction to CroissantPay</h1>
        <p className="text-xl text-muted-foreground mb-12">
          The open-source RevenueCat alternative for React Native in-app purchases
        </p>

        {/* What is CroissantPay */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What is CroissantPay?</h2>
          <p className="text-muted-foreground mb-4">
            CroissantPay is a complete solution for managing in-app purchases and subscriptions 
            in React Native applications. It handles the complexity of integrating with Apple's 
            App Store and Google Play, so you can focus on building your app.
          </p>
          <p className="text-muted-foreground mb-4">
            Whether you're building a subscription-based app, selling one-time purchases, or 
            offering consumables, CroissantPay provides a unified API that works across both platforms.
          </p>
        </section>

        {/* Why CroissantPay */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Why Choose CroissantPay?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Cross-Platform"
              description="One SDK for iOS and Android. Write purchase logic once and it works everywhere."
            />
            <FeatureCard
              icon={<Server className="w-6 h-6" />}
              title="Self-Hostable"
              description="Deploy on your own infrastructure with Docker. Full control over your data."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Server-Side Validation"
              description="All receipts are validated server-side for maximum security against fraud."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Built-in Analytics"
              description="Track MRR, churn, conversions, and more without any additional setup."
            />
            <FeatureCard
              icon={<CreditCard className="w-6 h-6" />}
              title="No Revenue Share"
              description="Unlike some alternatives, we don't take a cut of your revenue. Ever."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Open Source"
              description="MIT licensed. Inspect the code, contribute, or fork for your needs."
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="space-y-6">
            <Step
              number={1}
              title="Install the SDK"
              description="Add the CroissantPay React Native SDK to your project with npm or yarn."
            />
            <Step
              number={2}
              title="Configure Your Products"
              description="Set up your products, entitlements, and offerings in the dashboard."
            />
            <Step
              number={3}
              title="Display Your Paywall"
              description="Use our hooks to fetch offerings and display products to users."
            />
            <Step
              number={4}
              title="Process Purchases"
              description="When users purchase, we validate receipts and grant entitlements automatically."
            />
            <Step
              number={5}
              title="Check Access"
              description="Use hasEntitlement() to gate premium features in your app."
            />
          </div>
        </section>

        {/* Key Concepts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Key Concepts</h2>
          
          <div className="space-y-6">
            <Concept
              title="Products"
              description="Products map to items in the App Store and Google Play. They can be subscriptions, one-time purchases, or consumables. Each product is linked to entitlements that define what access it grants."
            />
            <Concept
              title="Entitlements"
              description="Entitlements represent features or content that users can unlock through purchases. For example, a 'premium' entitlement might unlock ad-free experience and exclusive content."
            />
            <Concept
              title="Offerings"
              description="Offerings are curated groups of products to show on your paywall. You can have different offerings for different use cases (e.g., a 'default' offering and a 'sale' offering)."
            />
            <Concept
              title="Subscribers"
              description="Subscribers are users identified by a unique app user ID. CroissantPay tracks their purchases, subscriptions, and entitlements across sessions and devices."
            />
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Architecture Overview</h2>
          <div className="p-6 rounded-xl bg-card border border-border">
            <pre className="text-sm overflow-x-auto">
{`┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   App Store /   │
│  (React Native) │     │   Google Play   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ SDK                   │ Receipts
         ▼                       ▼
┌─────────────────────────────────────────┐
│           CroissantPay Server           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Receipt │  │ Entitle │  │ Webhook │  │
│  │ Valid.  │  │  ments  │  │ Handler │  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
         │
         │ Webhooks
         ▼
┌─────────────────┐
│  Your Backend   │
│   (Optional)    │
└─────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Deployment Options */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Deployment Options</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">☁️ CroissantPay Cloud</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Managed service with automatic updates, scaling, and support. 
                Perfect for teams who want to focus on their app.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No infrastructure to manage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Automatic updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  99.9% SLA on paid plans
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-2">🏠 Self-Hosted</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Deploy on your own infrastructure with Docker. Full control 
                over your data and no usage limits.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Complete data ownership
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No subscriber limits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Free forever (MIT license)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Next Steps</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/docs/getting-started"
              className="flex items-center justify-between p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Quick Start Guide</span>
              </div>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/docs/sdk/react-native"
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">SDK Documentation</span>
              </div>
              <ArrowRight className="w-5 h-5" />
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Concept({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}



