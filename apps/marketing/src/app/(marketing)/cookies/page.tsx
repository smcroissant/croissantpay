import Link from "next/link";
import { Smartphone } from "lucide-react";
import { appUrl } from "@/lib/config";

export default function CookiesPage() {
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
        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 1, 2026</p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are placed on your computer or mobile device 
              when you visit a website. They are widely used to make websites work more 
              efficiently and to provide information to website owners.
            </p>
            <p className="text-muted-foreground">
              We use cookies and similar technologies (such as local storage) to improve 
              your experience on our website and Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Types of Cookies We Use</h2>
            
            <h3 className="text-lg font-semibold mb-3">Essential Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies are necessary for the Service to function properly. They enable 
              core functionality such as security, authentication, and session management.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 font-semibold">Cookie</th>
                    <th className="pb-2 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2"><code>session</code></td>
                    <td className="py-2">Authentication session</td>
                    <td className="py-2">7 days</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2"><code>csrf_token</code></td>
                    <td className="py-2">Security protection</td>
                    <td className="py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>org_id</code></td>
                    <td className="py-2">Current organization</td>
                    <td className="py-2">30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-3">Functional Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies enable enhanced functionality and personalization, such as 
              remembering your preferences and settings.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 font-semibold">Cookie</th>
                    <th className="pb-2 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2"><code>theme</code></td>
                    <td className="py-2">Dark/light mode preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2"><code>sidebar_collapsed</code></td>
                    <td className="py-2">UI preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>locale</code></td>
                    <td className="py-2">Language preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mb-3">Analytics Cookies</h3>
            <p className="text-muted-foreground mb-4">
              These cookies help us understand how visitors interact with our website by 
              collecting and reporting information anonymously.
            </p>
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 font-semibold">Cookie</th>
                    <th className="pb-2 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2"><code>_ga</code></td>
                    <td className="py-2">Google Analytics visitor ID</td>
                    <td className="py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>_gid</code></td>
                    <td className="py-2">Google Analytics session ID</td>
                    <td className="py-2">24 hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm">
              Note: Analytics cookies are only used on our marketing website, not in the 
              dashboard application.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Local Storage</h2>
            <p className="text-muted-foreground mb-4">
              In addition to cookies, we use browser local storage to store certain data 
              on your device:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Dashboard state:</strong> Collapsed sections, selected filters, 
                and other UI preferences
              </li>
              <li>
                <strong>Draft data:</strong> Unsaved form data to prevent loss on 
                accidental navigation
              </li>
              <li>
                <strong>Cache:</strong> Temporary data to improve performance
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Some cookies are placed by third-party services that appear on our pages. 
              We do not control these cookies and their use is governed by the privacy 
              policies of those third parties.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Stripe:</strong> Payment processing and fraud prevention
              </li>
              <li>
                <strong>Google Analytics:</strong> Website analytics (marketing site only)
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Managing Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>View what cookies are stored on your device</li>
              <li>Delete all or specific cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies from being set</li>
              <li>Clear all cookies when you close the browser</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Please note that blocking or deleting cookies may affect the functionality 
              of our Service. Essential cookies are required for the Service to work properly.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Browser Settings</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Do Not Track</h2>
            <p className="text-muted-foreground">
              Some browsers have a "Do Not Track" feature that signals to websites that 
              you do not want your online activity tracked. Our website respects Do Not 
              Track signals and will not load analytics cookies when this signal is detected.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Self-Hosted Deployments</h2>
            <p className="text-muted-foreground">
              If you use CroissantPay in a self-hosted configuration, only essential 
              cookies are used. No analytics or third-party cookies are set unless you 
              configure them yourself. You have full control over cookie behavior in your 
              deployment.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time. We will notify you of 
              any changes by posting the new policy on this page and updating the "Last 
              updated" date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about our use of cookies, please{" "}
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
