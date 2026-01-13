"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Mail,
  MessageSquare,
  Github,
  Send,
  Loader2,
  CheckCircle,
  Building2,
  HelpCircle,
  Bug,
  Sparkles,
} from "lucide-react";

const contactReasons = [
  { id: "sales", label: "Sales Inquiry", icon: Building2 },
  { id: "support", label: "Technical Support", icon: HelpCircle },
  { id: "bug", label: "Report a Bug", icon: Bug },
  { id: "feature", label: "Feature Request", icon: Sparkles },
  { id: "other", label: "Other", icon: MessageSquare },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    reason: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

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
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-muted-foreground">
            Have questions? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="order-2 lg:order-1">
            {isSubmitted ? (
              <div className="p-8 rounded-2xl bg-card border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
                <p className="text-muted-foreground mb-6">
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormState({ name: "", email: "", reason: "", message: "" });
                  }}
                  className="text-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reason for Contact</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {contactReasons.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setFormState({ ...formState, reason: reason.id })}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                          formState.reason === reason.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <reason.icon className="w-4 h-4" />
                        <span className="text-sm">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>
              
              <div className="space-y-4">
                <ContactMethod
                  icon={Mail}
                  title="Email"
                  description="For general inquiries"
                  link="mailto:hello@croissantpay.dev"
                  linkText="hello@croissantpay.dev"
                />
                <ContactMethod
                  icon={Github}
                  title="GitHub"
                  description="Bug reports and feature requests"
                  link="https://github.com/croissantpay/croissantpay/issues"
                  linkText="Open an Issue"
                />
                <ContactMethod
                  icon={MessageSquare}
                  title="Discord"
                  description="Join our community"
                  link="https://discord.gg/croissantpay"
                  linkText="Join Discord"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold mb-2">Enterprise Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Need dedicated support, custom SLAs, or enterprise features? 
                Let's discuss how we can help your organization.
              </p>
              <Link
                href="mailto:enterprise@croissantpay.dev"
                className="text-primary text-sm font-medium hover:underline"
              >
                Contact Enterprise Sales →
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-2">💡 Quick Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check our documentation for guides, tutorials, and API references. 
                Many questions are answered there.
              </p>
              <Link
                href="/docs"
                className="text-primary text-sm font-medium hover:underline"
              >
                Browse Documentation →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FAQItem
              question="What's your response time?"
              answer="We typically respond within 24 hours for general inquiries. Enterprise customers with SLAs receive priority support."
            />
            <FAQItem
              question="Do you offer phone support?"
              answer="Phone support is available for Enterprise customers. For others, email and Discord are the best ways to reach us."
            />
            <FAQItem
              question="Can I schedule a demo?"
              answer="Yes! Contact our sales team and we'll set up a personalized demo of CroissantPay Cloud."
            />
            <FAQItem
              question="Where can I report bugs?"
              answer="The best place is our GitHub repository. Open an issue and we'll triage it quickly."
            />
          </div>
        </div>
      </section>

    </div>
  );
}

function ContactMethod({
  icon: Icon,
  title,
  description,
  link,
  linkText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mb-1">{description}</p>
        <a href={link} className="text-sm text-primary hover:underline">
          {linkText}
        </a>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}



