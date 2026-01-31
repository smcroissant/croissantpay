import Link from "next/link";
import { Smartphone, Github } from "lucide-react";
import { marketingUrl } from "@/lib/config";

export function Footer() {
  const base = marketingUrl();
  return (
    <footer className="py-12 px-6 border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">CroissantPay</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open-source in-app purchase management for React Native.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`${base}/#features`} className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href={`${base}/pricing`} className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href={`${base}/changelog`} className="hover:text-foreground transition-colors">Changelog</a></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`${base}/docs`} className="hover:text-foreground transition-colors">Overview</a></li>
              <li><a href={`${base}/docs/introduction`} className="hover:text-foreground transition-colors">Introduction</a></li>
              <li><a href={`${base}/docs/getting-started`} className="hover:text-foreground transition-colors">Getting Started</a></li>
              <li><a href={`${base}/docs/self-hosted`} className="hover:text-foreground transition-colors">Self-Hosting Guide</a></li>
              <li><a href={`${base}/docs/api`} className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href={`${base}/docs/webhooks`} className="hover:text-foreground transition-colors">Webhooks</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">SDK & Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`${base}/docs/sdk`} className="hover:text-foreground transition-colors">SDK Overview</a></li>
              <li><a href={`${base}/docs/sdk/react-native`} className="hover:text-foreground transition-colors">React Native</a></li>
              <li><a href={`${base}/docs/sdk/ios-setup`} className="hover:text-foreground transition-colors">iOS Setup</a></li>
              <li><a href={`${base}/docs/sdk/android-setup`} className="hover:text-foreground transition-colors">Android Setup</a></li>
              <li><a href={`${base}/docs/features/products`} className="hover:text-foreground transition-colors">Products</a></li>
              <li><a href={`${base}/docs/features/entitlements`} className="hover:text-foreground transition-colors">Entitlements</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`${base}/about`} className="hover:text-foreground transition-colors">About</a></li>
              <li><a href={`${base}/blog`} className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href={`${base}/contact`} className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="https://github.com/croissantpay/croissantpay" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href={`${base}/terms`} className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href={`${base}/privacy`} className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href={`${base}/cookies`} className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              <li><a href={`${base}/acceptable-use`} className="hover:text-foreground transition-colors">Acceptable Use</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            © 2026 CroissantPay. Open source under MIT License.
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/croissantpay/croissantpay" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="https://twitter.com/croissantpay" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
