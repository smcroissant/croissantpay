import Link from "next/link";
import { Smartphone } from "lucide-react";
import { appUrl } from "@/lib/config";

export default function TermsPage() {
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
            <a
              href={`${appUrl()}/dashboard`}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 1, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using CroissantPay ("Service"), you agree to be bound by these 
              Terms of Service ("Terms"). If you disagree with any part of these terms, you 
              may not access the Service.
            </p>
            <p className="text-muted-foreground">
              These Terms apply to all visitors, users, and others who access or use the Service, 
              including our cloud-hosted platform and self-hosted software.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              CroissantPay provides an in-app purchase and subscription management platform 
              for mobile applications. Our Service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Receipt validation for iOS App Store and Google Play</li>
              <li>Subscription and entitlement management</li>
              <li>Analytics and reporting dashboard</li>
              <li>Webhook delivery for subscription events</li>
              <li>SDK for React Native applications</li>
              <li>API access for server-side integration</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
            <p className="text-muted-foreground mb-4">
              To use certain features of the Service, you must register for an account. When 
              you register, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and API keys</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Subscription and Payment</h2>
            
            <h3 className="text-lg font-semibold mb-3">Billing</h3>
            <p className="text-muted-foreground mb-4">
              For paid plans, you agree to pay all fees associated with your subscription. 
              Fees are billed in advance on a monthly or annual basis and are non-refundable, 
              except as required by law.
            </p>

            <h3 className="text-lg font-semibold mb-3">Price Changes</h3>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify pricing at any time. Price changes will be 
              communicated at least 30 days in advance and will take effect at the start 
              of your next billing cycle.
            </p>

            <h3 className="text-lg font-semibold mb-3">Free Tier</h3>
            <p className="text-muted-foreground">
              Our free tier is provided "as is" with usage limitations as described on our 
              pricing page. We reserve the right to modify or discontinue the free tier at 
              any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Use License</h2>
            
            <h3 className="text-lg font-semibold mb-3">Cloud Service</h3>
            <p className="text-muted-foreground mb-4">
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable 
              license to access and use the Service for your internal business purposes.
            </p>

            <h3 className="text-lg font-semibold mb-3">Self-Hosted Software</h3>
            <p className="text-muted-foreground mb-4">
              CroissantPay's self-hosted software is released under the MIT License. You may 
              use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies 
              of the Software, subject to the MIT License terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit malicious code or interfere with the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for fraudulent purposes</li>
              <li>Process payments for illegal goods or services</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Reverse engineer the Service (except where permitted by law)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              For detailed guidelines, please review our{" "}
              <Link href="/acceptable-use" className="text-primary hover:underline">
                Acceptable Use Policy
              </Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">7. Your Data</h2>
            
            <h3 className="text-lg font-semibold mb-3">Ownership</h3>
            <p className="text-muted-foreground mb-4">
              You retain all rights to your data. By using the Service, you grant us a 
              limited license to process your data solely to provide the Service.
            </p>

            <h3 className="text-lg font-semibold mb-3">Data Processing</h3>
            <p className="text-muted-foreground mb-4">
              We process data in accordance with our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>. For cloud customers processing personal data of EU residents, 
              we act as a data processor and will enter into a Data Processing Agreement 
              upon request.
            </p>

            <h3 className="text-lg font-semibold mb-3">Data Export</h3>
            <p className="text-muted-foreground">
              You may export your data at any time through our API or dashboard. Upon 
              account termination, we will retain your data for 30 days to allow for 
              export before deletion.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Service and its original content (excluding user data), features, and 
              functionality are owned by CroissantPay and are protected by international 
              copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              The CroissantPay name, logo, and all related names, logos, product and 
              service names are trademarks of CroissantPay. You may not use these marks 
              without our prior written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">9. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              The Service integrates with third-party services, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Apple App Store (for iOS receipt validation)</li>
              <li>Google Play (for Android receipt validation)</li>
              <li>Stripe (for payment processing)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Your use of these services is subject to their respective terms. We are not 
              responsible for third-party service availability or functionality.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">10. Service Availability</h2>
            <p className="text-muted-foreground mb-4">
              We strive to maintain high availability of our Service. However, we do not 
              guarantee uninterrupted access. We may suspend or discontinue the Service 
              for maintenance, updates, or other reasons.
            </p>
            <p className="text-muted-foreground">
              For paid plans, we provide a Service Level Agreement (SLA) with uptime 
              commitments as specified on our pricing page.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF 
              ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED 
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
              NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground">
              We do not warrant that the Service will be uninterrupted, secure, or 
              error-free, or that any defects will be corrected.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CROISSANTPAY SHALL NOT BE LIABLE 
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL.
            </p>
            <p className="text-muted-foreground">
              Our total liability for any claims under these Terms shall not exceed the 
              amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless CroissantPay and its officers, 
              directors, employees, and agents from any claims, damages, or expenses 
              arising from your use of the Service, your violation of these Terms, or 
              your violation of any rights of another.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">14. Termination</h2>
            <p className="text-muted-foreground mb-4">
              You may terminate your account at any time by contacting us or through 
              the dashboard. We may terminate or suspend your account immediately, 
              without prior notice, for any breach of these Terms.
            </p>
            <p className="text-muted-foreground">
              Upon termination, your right to use the Service will cease immediately. 
              All provisions of these Terms which should survive termination shall 
              survive, including ownership provisions, warranty disclaimers, and 
              limitations of liability.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">15. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws 
              of France, without regard to its conflict of law provisions. Any disputes 
              arising from these Terms shall be resolved in the courts of Paris, France.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">16. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify these Terms at any time. We will notify 
              you of any material changes by email and/or by posting a notice on our 
              Service at least 30 days before the changes take effect.
            </p>
            <p className="text-muted-foreground">
              Your continued use of the Service after the effective date constitutes 
              acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">17. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact us through our form
              </Link>.
            </p>
            <p className="text-muted-foreground">
              Address: 123 Rue de la Paix, 75002 Paris, France
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
