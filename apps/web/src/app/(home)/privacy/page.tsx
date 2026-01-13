import Link from "next/link";
import { Smartphone } from "lucide-react";

export default function PrivacyPage() {
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 1, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              CroissantPay ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our service.
            </p>
            <p className="text-muted-foreground">
              Please read this privacy policy carefully. If you do not agree with the terms 
              of this privacy policy, please do not access the service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            
            <h3 className="text-lg font-semibold mb-3">Information You Provide</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Account information (name, email address, password)</li>
              <li>Organization information (name, team members)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Communication preferences</li>
              <li>Support requests and feedback</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>API usage statistics</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Information from App Users</h3>
            <p className="text-muted-foreground mb-4">
              When you use CroissantPay to manage in-app purchases, we may process:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>App user identifiers (as defined by you)</li>
              <li>Purchase and subscription data</li>
              <li>Entitlement information</li>
              <li>Device identifiers for receipt validation</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To provide and maintain our service</li>
              <li>To process transactions and send related information</li>
              <li>To send administrative information (updates, security alerts)</li>
              <li>To respond to your comments and questions</li>
              <li>To analyze usage and improve our service</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your personal information for as long as your account is active or 
              as needed to provide you services. We will retain and use your information 
              as necessary to comply with legal obligations, resolve disputes, and enforce 
              our agreements.
            </p>
            <p className="text-muted-foreground">
              For self-hosted deployments, data retention is entirely under your control.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Service providers:</strong> Third parties that help us operate our 
                service (e.g., payment processing, hosting, analytics)
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Business transfers:</strong> In connection with a merger, acquisition, 
                or sale of assets
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to protect 
              your personal information against unauthorized access, alteration, disclosure, 
              or destruction.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data is encrypted in transit (TLS 1.3)</li>
              <li>Sensitive data is encrypted at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliance (Cloud service)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Restrict processing of your data</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@croissantpay.dev" className="text-primary hover:underline">
                privacy@croissantpay.dev
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Self-Hosted Deployments</h2>
            <p className="text-muted-foreground mb-4">
              If you use CroissantPay in a self-hosted configuration:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>All data is stored on your own infrastructure</li>
              <li>We do not have access to your data</li>
              <li>You are responsible for your own privacy compliance</li>
              <li>We only collect anonymous usage analytics (if enabled)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our service</li>
              <li>Improve our service</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can control cookies through your browser settings. Note that disabling 
              cookies may affect the functionality of our service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for individuals under the age of 16. We do not 
              knowingly collect personal information from children. If you become aware 
              that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and processed in countries other than 
              your own. We ensure appropriate safeguards are in place for such transfers, 
              including Standard Contractual Clauses where required.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the "Last 
              updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li>
                Email:{" "}
                <a href="mailto:privacy@croissantpay.dev" className="text-primary hover:underline">
                  privacy@croissantpay.dev
                </a>
              </li>
              <li>
                Address: 123 Rue de la Paix, 75002 Paris, France
              </li>
            </ul>
          </section>
        </div>
      </main>

    </div>
  );
}



