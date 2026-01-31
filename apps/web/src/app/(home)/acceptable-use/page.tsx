import Link from "next/link";
import { Smartphone } from "lucide-react";

export default function AcceptableUsePage() {
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
        <h1 className="text-4xl font-bold mb-2">Acceptable Use Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 1, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <p className="text-muted-foreground mb-4">
              This Acceptable Use Policy ("AUP") describes the rules for using CroissantPay's 
              services. By using our Service, you agree to comply with this policy.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate this policy. 
              If you become aware of any violations, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                report them through our contact form
              </Link>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Prohibited Activities</h2>
            
            <h3 className="text-lg font-semibold mb-3">Illegal Activities</h3>
            <p className="text-muted-foreground mb-4">
              You may not use our Service for any illegal purposes, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Processing payments for illegal goods or services</li>
              <li>Money laundering or terrorist financing</li>
              <li>Operating illegal gambling services</li>
              <li>Distributing illegal content</li>
              <li>Violating export control laws or sanctions</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Fraudulent Activities</h3>
            <p className="text-muted-foreground mb-4">
              Fraudulent or deceptive practices are strictly prohibited:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Creating fake or misleading in-app purchases</li>
              <li>Misrepresenting products or services to end users</li>
              <li>Using stolen payment information</li>
              <li>Receipt fraud or manipulation</li>
              <li>Subscription scams or dark patterns</li>
              <li>Impersonating another person or organization</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Harmful Content</h3>
            <p className="text-muted-foreground mb-4">
              You may not use our Service for applications that contain or promote:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Child sexual abuse material (CSAM)</li>
              <li>Content that exploits or endangers minors</li>
              <li>Hate speech or discrimination</li>
              <li>Violent extremism or terrorism</li>
              <li>Non-consensual intimate images</li>
              <li>Content that promotes self-harm or suicide</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Security Violations</h3>
            <p className="text-muted-foreground mb-4">
              Actions that compromise the security of our Service or others are prohibited:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
              <li>Attempting to access systems or data without authorization</li>
              <li>Distributing malware, viruses, or other harmful code</li>
              <li>Conducting denial-of-service attacks</li>
              <li>Phishing or social engineering attacks</li>
              <li>Exploiting vulnerabilities without responsible disclosure</li>
              <li>Circumventing security measures or access controls</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">Abuse of Service</h3>
            <p className="text-muted-foreground mb-4">
              Do not abuse or misuse our Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Creating multiple accounts to circumvent usage limits</li>
              <li>Reselling or redistributing the Service without authorization</li>
              <li>Interfering with other users' access to the Service</li>
              <li>Automated abuse or excessive API requests beyond rate limits</li>
              <li>Using the Service to send spam or unsolicited communications</li>
              <li>Scraping or harvesting data without permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">App Store Compliance</h2>
            <p className="text-muted-foreground mb-4">
              When using CroissantPay to process in-app purchases, you must also comply with:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <a href="https://developer.apple.com/app-store/review/guidelines/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Apple App Store Review Guidelines
                </a>
              </li>
              <li>
                <a href="https://play.google.com/about/developer-content-policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google Play Developer Program Policies
                </a>
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Violations of app store policies may result in suspension of your CroissantPay 
              account in addition to any actions taken by Apple or Google.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Restricted Industries</h2>
            <p className="text-muted-foreground mb-4">
              The following industries require prior approval before using our Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Adult content or services (age 18+)</li>
              <li>Gambling, gaming, or contests (where legal)</li>
              <li>Cryptocurrency or virtual currencies</li>
              <li>Pharmaceutical or healthcare products</li>
              <li>Weapons, ammunition, or related accessories</li>
              <li>Tobacco, alcohol, or cannabis products</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To request approval,{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact us through our form
              </Link>{" "}
              with details about your use case.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">API Usage</h2>
            <p className="text-muted-foreground mb-4">
              When using our API, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Respect rate limits and quotas for your plan</li>
              <li>Keep your API keys confidential and secure</li>
              <li>Not share API keys between unrelated applications</li>
              <li>Implement proper error handling and retry logic</li>
              <li>Not use the API in ways that degrade service for others</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Data Protection</h2>
            <p className="text-muted-foreground mb-4">
              When processing end-user data through our Service, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Comply with applicable data protection laws (GDPR, CCPA, etc.)</li>
              <li>Have a valid legal basis for processing user data</li>
              <li>Provide clear privacy notices to your users</li>
              <li>Respond to user data access and deletion requests</li>
              <li>Not process sensitive personal data without consent</li>
              <li>Implement appropriate security measures</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Reporting Violations</h2>
            <p className="text-muted-foreground mb-4">
              If you become aware of any violations of this policy, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                report them through our contact form
              </Link>.
            </p>
            <p className="text-muted-foreground">
              Please include as much detail as possible, including relevant account 
              information, URLs, and evidence of the violation.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Enforcement</h2>
            <p className="text-muted-foreground mb-4">
              Violations of this policy may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Warning or notice of violation</li>
              <li>Temporary suspension of access</li>
              <li>Permanent termination of your account</li>
              <li>Reporting to law enforcement authorities</li>
              <li>Legal action to recover damages</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We will make reasonable efforts to notify you before taking action, except 
              in cases where immediate action is necessary to prevent harm or comply with 
              legal requirements.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Appeals</h2>
            <p className="text-muted-foreground">
              If you believe your account was suspended or terminated in error, you may 
              appeal by{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contacting us through our form
              </Link>. 
              Include your account information and a detailed explanation of why you 
              believe the decision was incorrect. We will review appeals within 10 
              business days.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Acceptable Use Policy from time to time. We will notify 
              you of any material changes by email and/or by posting a notice on our 
              Service. Your continued use of the Service after the effective date 
              constitutes acceptance of the modified policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Acceptable Use Policy, please{" "}
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
