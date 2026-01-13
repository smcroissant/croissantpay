import Link from "next/link";
import { Smartphone, Github } from "lucide-react";

export function Footer() {
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
              <li><Link href="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground transition-colors">Overview</Link></li>
              <li><Link href="/docs/introduction" className="hover:text-foreground transition-colors">Introduction</Link></li>
              <li><Link href="/docs/getting-started" className="hover:text-foreground transition-colors">Getting Started</Link></li>
              <li><Link href="/docs/self-hosted" className="hover:text-foreground transition-colors">Self-Hosting Guide</Link></li>
              <li><Link href="/docs/api" className="hover:text-foreground transition-colors">API Reference</Link></li>
              <li><Link href="/docs/webhooks" className="hover:text-foreground transition-colors">Webhooks</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">SDK & Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs/sdk" className="hover:text-foreground transition-colors">SDK Overview</Link></li>
              <li><Link href="/docs/sdk/react-native" className="hover:text-foreground transition-colors">React Native</Link></li>
              <li><Link href="/docs/sdk/ios-setup" className="hover:text-foreground transition-colors">iOS Setup</Link></li>
              <li><Link href="/docs/sdk/android-setup" className="hover:text-foreground transition-colors">Android Setup</Link></li>
              <li><Link href="/docs/features/products" className="hover:text-foreground transition-colors">Products</Link></li>
              <li><Link href="/docs/features/entitlements" className="hover:text-foreground transition-colors">Entitlements</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="https://github.com/croissantpay/croissantpay" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</Link></li>
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
