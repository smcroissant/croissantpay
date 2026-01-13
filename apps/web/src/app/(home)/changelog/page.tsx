import Link from "next/link";
import { Smartphone, Github, Sparkles, Bug, Zap, ArrowRight } from "lucide-react";

const releases = [
  {
    version: "1.2.0",
    date: "January 2, 2026",
    title: "A/B Testing & Promo Codes",
    description: "Run experiments on your offerings and create promotional codes",
    changes: [
      { type: "feature", text: "A/B testing for offerings with detailed analytics" },
      { type: "feature", text: "Promo codes with percentage and fixed discounts" },
      { type: "feature", text: "Free trial extension promo codes" },
      { type: "feature", text: "Bulk promo code generation" },
      { type: "improvement", text: "Improved dashboard analytics" },
      { type: "improvement", text: "Better webhook retry logic" },
    ],
  },
  {
    version: "1.1.0",
    date: "December 15, 2025",
    title: "Team Management & Invitations",
    description: "Collaborate with your team on CroissantPay",
    changes: [
      { type: "feature", text: "Team invitations via email" },
      { type: "feature", text: "Role-based access control (owner, admin, member)" },
      { type: "feature", text: "Organization switching in header" },
      { type: "improvement", text: "Updated settings page with team management" },
      { type: "fix", text: "Fixed organization slug uniqueness" },
    ],
  },
  {
    version: "1.0.0",
    date: "December 1, 2025",
    title: "Initial Release",
    description: "The first stable release of CroissantPay",
    changes: [
      { type: "feature", text: "React Native SDK with StoreKit 2 and Google Play Billing v6" },
      { type: "feature", text: "Receipt validation for iOS and Android" },
      { type: "feature", text: "Entitlement-based access control" },
      { type: "feature", text: "Products and offerings management" },
      { type: "feature", text: "Subscriber management dashboard" },
      { type: "feature", text: "Real-time webhooks" },
      { type: "feature", text: "Analytics dashboard with MRR, churn, and more" },
      { type: "feature", text: "Self-hosted deployment with Docker" },
      { type: "feature", text: "Cloud deployment option" },
    ],
  },
  {
    version: "0.9.0",
    date: "November 15, 2025",
    title: "Beta Release",
    description: "Public beta with core features",
    changes: [
      { type: "feature", text: "Core SDK implementation" },
      { type: "feature", text: "Basic dashboard" },
      { type: "feature", text: "Receipt validation" },
      { type: "improvement", text: "Documentation improvements" },
      { type: "fix", text: "Various stability fixes" },
    ],
  },
];

export default function ChangelogPage() {
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
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
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

      {/* Header */}
      <section className="py-16 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-xl text-muted-foreground mb-6">
            New features, improvements, and fixes in CroissantPay
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="https://github.com/croissantpay/croissantpay/releases"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Releases */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {releases.map((release, idx) => (
            <article key={release.version} className="relative">
              {/* Timeline line */}
              {idx !== releases.length - 1 && (
                <div className="absolute left-[15px] top-12 bottom-0 w-0.5 bg-border" />
              )}
              
              <div className="flex gap-6">
                {/* Version badge */}
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {release.version.split('.')[0]}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-12">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      v{release.version}
                    </span>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">{release.title}</h2>
                  <p className="text-muted-foreground mb-6">{release.description}</p>

                  <ul className="space-y-2">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <ChangeIcon type={change.type} />
                        <span className="text-sm">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Stay up to date</h2>
          <p className="text-muted-foreground mb-6">
            Star us on GitHub to get notified about new releases
          </p>
          <Link
            href="https://github.com/croissantpay/croissantpay"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Github className="w-5 h-5" />
            Star on GitHub
          </Link>
        </div>
      </section>

    </div>
  );
}

function ChangeIcon({ type }: { type: string }) {
  const icons = {
    feature: <Sparkles className="w-4 h-4 text-green-500" />,
    improvement: <Zap className="w-4 h-4 text-blue-500" />,
    fix: <Bug className="w-4 h-4 text-orange-500" />,
  };
  
  return (
    <div className="mt-0.5 shrink-0">
      {icons[type as keyof typeof icons] || icons.improvement}
    </div>
  );
}



