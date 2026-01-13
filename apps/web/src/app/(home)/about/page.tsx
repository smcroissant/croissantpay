import Link from "next/link";
import { Smartphone, Github, Heart, Globe, Users, Shield, Zap, Code } from "lucide-react";

export default function AboutPage() {
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

      {/* Hero */}
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Making In-App Purchases
            <br />
            <span className="text-primary">Accessible to Everyone</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            CroissantPay was born from the frustration of dealing with complex payment 
            systems. We believe every developer should have access to great tools, 
            regardless of budget.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                We're building the open-source alternative to expensive, proprietary 
                payment management solutions. Our goal is simple: make it easy for 
                developers to monetize their apps without giving up control or 
                breaking the bank.
              </p>
              <p className="text-muted-foreground">
                Whether you're a solo developer working on your first app or an 
                enterprise team with millions of users, CroissantPay scales with you.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ValueCard icon={Heart} title="Open Source" description="MIT licensed, forever free to self-host" />
              <ValueCard icon={Shield} title="Privacy First" description="Your data stays yours" />
              <ValueCard icon={Zap} title="Developer Focus" description="Built by developers, for developers" />
              <ValueCard icon={Globe} title="Global" description="Works anywhere, for anyone" />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 bg-card/50 border-t border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-muted-foreground">
              CroissantPay started as an internal tool. Like many developers, we were 
              frustrated with the complexity of integrating in-app purchases. The existing 
              solutions were either too expensive for indie developers or required giving 
              up a percentage of revenue.
            </p>
            <p className="text-muted-foreground mt-4">
              We built CroissantPay to solve our own problems, then realized others might 
              benefit too. The name? We're based in Paris, and what better way to start 
              your day than with a croissant—and smooth payment integrations.
            </p>
            <p className="text-muted-foreground mt-4">
              Today, CroissantPay powers thousands of apps, from small indie games to 
              enterprise applications. We're proud to offer both a managed cloud service 
              and a self-hosted option, because we believe you should have the freedom to 
              choose.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">What We Believe</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <BeliefCard
              title="Transparency"
              description="No hidden fees, no surprise charges. You know exactly what you're paying for."
            />
            <BeliefCard
              title="Simplicity"
              description="Complex problems deserve elegant solutions. We obsess over developer experience."
            />
            <BeliefCard
              title="Community"
              description="We build in the open and welcome contributions. Your feedback shapes the product."
            />
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 px-6 bg-card/50 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Code className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Open Source at Heart</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            CroissantPay is fully open source under the MIT license. Inspect the code, 
            contribute improvements, or fork it for your own needs. We believe open 
            source makes better software.
          </p>
          <Link
            href="https://github.com/croissantpay/croissantpay"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers building with CroissantPay
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-secondary font-semibold hover:bg-secondary/80 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <Icon className="w-8 h-8 text-primary mb-3" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BeliefCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}



