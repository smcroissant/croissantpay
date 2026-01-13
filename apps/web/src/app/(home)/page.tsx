import Link from "next/link";
import { headers } from "next/headers";
import {
  Smartphone,
  Shield,
  Zap,
  BarChart3,
  Code2,
  ArrowRight,
  Check,
  Github,
  Server,
  Cloud,
  X,
  LayoutDashboard,
} from "lucide-react";
import { PLANS, formatPrice, formatLimit } from "@/lib/config";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="min-h-screen animated-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://github.com"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow-primary flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow-primary"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm mb-8">
            <Zap className="w-4 h-4" />
            <span>Open-source RevenueCat alternative</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            In-App Purchases
            <br />
            <span className="gradient-text">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Subscription and in-app purchase management for React Native.
            Self-host for free or use our managed cloud — your choice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all glow-primary"
            >
              <Cloud className="w-5 h-5" />
              Try Cloud Free
            </Link>
            <Link
              href="/docs/self-hosted"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Server className="w-5 h-5" />
              Self-Host
            </Link>
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Deploy Your Way
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Choose between our managed cloud service or self-host on your own infrastructure.
            Same great features, your choice of control.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Cloud Option */}
            <div className="relative p-8 rounded-2xl bg-card border-2 border-primary">
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                Recommended
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Cloud className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">CroissantPay Cloud</h3>
              <p className="text-muted-foreground mb-6">
                Fully managed service. We handle infrastructure, updates, and scaling.
                Start free, pay as you grow.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Zero maintenance",
                  "Automatic updates",
                  "Global CDN & edge locations",
                  "99.9% uptime SLA",
                  "Managed backups",
                  "Priority support available",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Self-Hosted Option */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <Server className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Self-Hosted</h3>
              <p className="text-muted-foreground mb-6">
                Run CroissantPay on your own servers. Full control over your data
                and infrastructure. Forever free.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "100% open source",
                  "No usage limits",
                  "Your data, your servers",
                  "Zero revenue share",
                  "Docker & Kubernetes ready",
                  "Community support",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/docs/self-hosted"
                className="block w-full text-center px-6 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need for mobile payments
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            A complete solution for managing subscriptions and in-app purchases
            across iOS and Android.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Simple React Native SDK
              </h2>
              <p className="text-muted-foreground mb-8">
                Integrate in minutes with our type-safe SDK. Handle purchases,
                restore transactions, and check entitlements with ease.
              </p>
              <ul className="space-y-3">
                {sdkFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl blur-3xl" />
              <div className="relative rounded-2xl bg-card border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/50">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-sm text-muted-foreground font-mono">
                    App.tsx
                  </span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto font-mono">
                  <code className="text-muted-foreground">
                    {codeExample}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-center mb-4 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, no revenue share.
          </p>
          <p className="text-center mb-12">
            <span className="text-primary font-medium">Self-hosting is always free</span>
            <span className="text-muted-foreground"> — cloud plans below</span>
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.slice(0, 4).map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl bg-card border ${
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  <PlanFeature
                    label="Apps"
                    value={formatLimit(plan.features.maxApps)}
                  />
                  <PlanFeature
                    label="Subscribers"
                    value={formatLimit(plan.features.maxSubscribers)}
                  />
                  <PlanFeature
                    label="API Requests"
                    value={`${formatLimit(plan.features.maxApiRequests)}/mo`}
                  />
                  <PlanFeature
                    label="Team Members"
                    value={formatLimit(plan.features.teamMembers)}
                  />
                  <PlanFeatureCheck
                    label="Priority Support"
                    enabled={plan.features.prioritySupport}
                  />
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center px-4 py-3 rounded-xl font-semibold transition-colors ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {plan.price === 0 ? "Get Started" : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="mt-8 p-8 rounded-2xl bg-card border border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground max-w-xl">
                  Custom solutions for large organizations. Dedicated support,
                  custom SLAs, SSO, and more. Let's build something great together.
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 px-8 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to take control of your payments?
          </h2>
          <p className="text-muted-foreground mb-8">
            Get started in minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all glow-primary"
            >
              Start with Cloud
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/croissantpay/croissantpay"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanFeature({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function PlanFeatureCheck({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {enabled ? (
        <Check className="w-4 h-4 text-primary" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50" />
      )}
      <span className={enabled ? "" : "text-muted-foreground/50"}>{label}</span>
    </li>
  );
}

const features = [
  {
    icon: Shield,
    title: "Receipt Validation",
    description:
      "Server-side validation for iOS App Store and Google Play. Secure and reliable.",
  },
  {
    icon: Zap,
    title: "Real-time Webhooks",
    description:
      "Instant notifications for subscription events. Never miss a renewal or cancellation.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track MRR, churn, LTV, and more. Make data-driven decisions.",
  },
  {
    icon: Code2,
    title: "Developer First",
    description:
      "Clean APIs, TypeScript SDK, and comprehensive documentation.",
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description:
      "Single subscriber identity across iOS and Android. Seamless experience.",
  },
  {
    icon: Server,
    title: "Self-Host or Cloud",
    description:
      "Run on your servers or use our managed cloud. Same features, your choice.",
  },
];

const sdkFeatures = [
  "TypeScript support out of the box",
  "StoreKit 2 and Google Play Billing v5+",
  "Automatic receipt validation",
  "Entitlement-based access control",
  "Offline support with local caching",
];

const codeExample = `import { CroissantPay } from '@croissantpay/react-native';

// Initialize SDK
CroissantPay.configure({
  apiKey: 'mx_public_xxx',
});

// Check entitlements
const { entitlements } = await CroissantPay.getSubscriberInfo();

if (entitlements.premium?.isActive) {
  // User has premium access
}

// Make a purchase
const result = await CroissantPay.purchase('monthly_premium');`;
