import Link from "next/link";
import { headers } from "next/headers";
import {
  Smartphone,
  Check,
  X,
  ArrowRight,
  Server,
  Cloud,
  Zap,
  Shield,
  Clock,
  HeadphonesIcon,
  Github,
  LayoutDashboard,
} from "lucide-react";
import { PLANS, formatPrice, formatLimit } from "@/lib/config";
import { auth } from "@/lib/auth";

export default async function PricingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Start free, scale as you grow. No hidden fees, no revenue share.
          Self-hosting is always free.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="#cloud"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Cloud className="w-5 h-5" />
            Cloud Plans
          </Link>
          <Link
            href="#self-hosted"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Server className="w-5 h-5" />
            Self-Hosted
          </Link>
        </div>
      </section>

      {/* Cloud Plans */}
      <section id="cloud" className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <Cloud className="w-4 h-4" />
              CroissantPay Cloud
            </div>
            <h2 className="text-3xl font-bold mb-4">Managed Cloud Plans</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We handle infrastructure, updates, and scaling. You focus on your app.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {PLANS.slice(0, 4).map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Enterprise */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground mb-4">
                  Custom solutions for large organizations with specific requirements.
                </p>
                <ul className="grid md:grid-cols-2 gap-3">
                  {[
                    "Unlimited everything",
                    "Custom SLA (99.99%+)",
                    "Dedicated support engineer",
                    "SSO / SAML integration",
                    "Custom data retention",
                    "On-premise deployment option",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/contact"
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold"
                >
                  Contact Sales
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-6 bg-card/50 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Compare all features
          </h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 font-medium">Feature</th>
                  {PLANS.slice(0, 4).map((plan) => (
                    <th
                      key={plan.id}
                      className={`text-center px-4 py-4 font-medium ${
                        plan.popular ? "text-primary" : ""
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <FeatureRow
                  feature="Apps"
                  values={PLANS.slice(0, 4).map((p) =>
                    formatLimit(p.features.maxApps)
                  )}
                />
                <FeatureRow
                  feature="Subscribers"
                  values={PLANS.slice(0, 4).map((p) =>
                    formatLimit(p.features.maxSubscribers)
                  )}
                />
                <FeatureRow
                  feature="API Requests / month"
                  values={PLANS.slice(0, 4).map((p) =>
                    formatLimit(p.features.maxApiRequests)
                  )}
                />
                <FeatureRow
                  feature="Team Members"
                  values={PLANS.slice(0, 4).map((p) =>
                    formatLimit(p.features.teamMembers)
                  )}
                />
                <FeatureRow
                  feature="Webhook Retention"
                  values={PLANS.slice(0, 4).map(
                    (p) => `${p.features.webhookRetention} days`
                  )}
                />
                <FeatureRow
                  feature="Analytics Retention"
                  values={PLANS.slice(0, 4).map(
                    (p) => `${p.features.analyticsRetention} days`
                  )}
                />
                <FeatureRow
                  feature="Priority Support"
                  values={PLANS.slice(0, 4).map((p) => p.features.prioritySupport)}
                  boolean
                />
                <FeatureRow
                  feature="Custom Branding"
                  values={PLANS.slice(0, 4).map((p) => p.features.customBranding)}
                  boolean
                />
                <FeatureRow
                  feature="SLA"
                  values={PLANS.slice(0, 4).map((p) => p.features.sla || "—")}
                />
                <FeatureRow
                  feature="Dedicated Support"
                  values={PLANS.slice(0, 4).map((p) => p.features.dedicatedSupport)}
                  boolean
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Self-Hosted */}
      <section id="self-hosted" className="py-16 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-sm mb-4">
              <Server className="w-4 h-4" />
              Self-Hosted
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Run on Your Own Infrastructure
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              100% open source, unlimited everything, forever free.
              Your data never leaves your servers.
            </p>
          </div>

          <div className="bg-card border-2 border-primary rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold">Self-Hosted</h3>
                <p className="text-muted-foreground">
                  Full control over your data and infrastructure
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">Free</p>
                <p className="text-muted-foreground">forever</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Unlimited Everything
                </h4>
                <ul className="space-y-2">
                  {[
                    "Unlimited apps",
                    "Unlimited subscribers",
                    "Unlimited API requests",
                    "Unlimited team members",
                    "Unlimited data retention",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Full Control
                </h4>
                <ul className="space-y-2">
                  {[
                    "Your servers, your data",
                    "Zero revenue share",
                    "Docker & Kubernetes ready",
                    "Custom modifications",
                    "No vendor lock-in",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/docs/self-hosted"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
              >
                Read Documentation
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="https://github.com/croissantpay/croissantpay"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </Link>
            </div>
          </div>

          {/* Quick Deploy */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="font-semibold mb-4">Quick Deploy</h4>
            <div className="bg-background rounded-xl p-4 font-mono text-sm overflow-x-auto">
              <code className="text-muted-foreground">
                <span className="text-primary">$</span> git clone https://github.com/croissantpay/croissantpay.git
                <br />
                <span className="text-primary">$</span> cd croissantpay
                <br />
                <span className="text-primary">$</span> docker compose up -d
              </code>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              That's it! CroissantPay will be running at{" "}
              <code className="px-1 py-0.5 bg-secondary rounded">
                http://localhost:3000
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-card/50 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQ
              question="Can I switch between Cloud and Self-Hosted?"
              answer="Yes! You can export your data from Cloud and import it into a self-hosted instance anytime, or vice versa. We don't lock you in."
            />
            <FAQ
              question="Do you take a cut of my revenue?"
              answer="No. Unlike some alternatives, CroissantPay never takes a percentage of your in-app purchase revenue. You only pay the flat subscription fee for Cloud, or nothing for self-hosted."
            />
            <FAQ
              question="What happens if I exceed my plan limits?"
              answer="We won't cut you off immediately. You'll receive warnings at 80% and 100% usage. If you consistently exceed limits, we'll reach out to discuss upgrading."
            />
            <FAQ
              question="Is the self-hosted version really free?"
              answer="Yes, 100% free and open source under the MIT license. You can use it commercially, modify it, and even sell services built on top of it."
            />
            <FAQ
              question="Do you offer annual billing discounts?"
              answer="Yes! Annual billing gives you 2 months free (about 17% discount). You can switch between monthly and annual anytime."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Start for free today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
            >
              Start with Cloud
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/docs/self-hosted"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-semibold"
            >
              <Server className="w-5 h-5" />
              Self-Host Guide
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function PlanCard({ plan }: { plan: (typeof PLANS)[0] }) {
  return (
    <div
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
      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
        {plan.price > 0 && (
          <span className="text-muted-foreground">/month</span>
        )}
      </div>
      <ul className="space-y-3 mb-6">
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Apps</span>
          <span className="font-medium">
            {formatLimit(plan.features.maxApps)}
          </span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subscribers</span>
          <span className="font-medium">
            {formatLimit(plan.features.maxSubscribers)}
          </span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">API Requests</span>
          <span className="font-medium">
            {formatLimit(plan.features.maxApiRequests)}/mo
          </span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          {plan.features.prioritySupport ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <X className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span
            className={
              plan.features.prioritySupport ? "" : "text-muted-foreground/50"
            }
          >
            Priority Support
          </span>
        </li>
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
  );
}

function FeatureRow({
  feature,
  values,
  boolean: isBool = false,
}: {
  feature: string;
  values: (string | boolean)[];
  boolean?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-6 py-4 text-sm">{feature}</td>
      {values.map((value, i) => (
        <td key={i} className="text-center px-4 py-4">
          {isBool ? (
            value ? (
              <Check className="w-5 h-5 text-primary mx-auto" />
            ) : (
              <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
            )
          ) : (
            <span className="text-sm font-medium">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground text-sm">{answer}</p>
    </div>
  );
}

