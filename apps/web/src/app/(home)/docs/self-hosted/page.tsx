import Link from "next/link";
import {
  Smartphone,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Server,
  Database,
  Shield,
  Settings,
  AlertTriangle,
} from "lucide-react";

export default function SelfHostedPage() {
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
            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-medium">
              Docs
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              All Docs
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <span>/</span>
          <span className="text-foreground">Self-Hosted</span>
        </nav>

        <div className="flex items-center gap-3 mb-4">
          <Server className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Self-Hosting Guide</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-12">
          Deploy CroissantPay on your own infrastructure with Docker.
        </p>

        {/* Requirements */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Requirements</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Docker and Docker Compose installed</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>At least 1 GB RAM and 10 GB storage</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>PostgreSQL 14+ (included in Docker Compose)</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Domain with SSL for webhooks (optional for development)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
          <p className="text-muted-foreground mb-4">
            The fastest way to get CroissantPay running locally.
          </p>
          <CodeBlock
            title="Terminal"
            code={`# Clone the repository
git clone https://github.com/croissantpay/croissantpay.git
cd croissantpay

# Start with Docker Compose
docker compose up -d

# CroissantPay is now running at http://localhost:3000`}
          />
        </section>

        {/* Configuration */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Create a <code className="px-1.5 py-0.5 bg-secondary rounded text-sm">.env</code> file to configure CroissantPay.
          </p>
          <CodeBlock
            title=".env"
            code={`# Database
DATABASE_URL=postgresql://croissantpay:croissantpay@localhost:5432/croissantpay

# Deployment mode (self-hosted or cloud)
CROISSANTPAY_DEPLOYMENT_MODE=self-hosted

# Authentication
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Optional: Email notifications (using Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM="CroissantPay <noreply@yourdomain.com>"`}
          />
        </section>

        {/* Database */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Database Setup
          </h2>
          <p className="text-muted-foreground mb-4">
            Run database migrations to create the required tables.
          </p>
          <CodeBlock
            title="Terminal"
            code={`# Using Docker
docker compose exec web pnpm db:push

# Or locally
cd apps/web
pnpm db:push`}
          />
        </section>

        {/* Production Deployment */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Production Deployment</h2>
          <p className="text-muted-foreground mb-4">
            For production, you'll want to configure SSL and use a proper domain.
          </p>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                SSL / HTTPS
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Apple and Google webhooks require HTTPS. Use a reverse proxy like Nginx or Traefik with Let's Encrypt.
              </p>
              <CodeBlock
                title="docker-compose.prod.yml (with Traefik)"
                code={`services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./letsencrypt:/letsencrypt"

  web:
    labels:
      - "traefik.http.routers.croissantpay.rule=Host(\`croissantpay.yourdomain.com\`)"
      - "traefik.http.routers.croissantpay.tls.certresolver=letsencrypt"`}
              />
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Production Environment
              </h3>
              <CodeBlock
                title=".env.production"
                code={`# Use a managed PostgreSQL in production
DATABASE_URL=postgresql://user:password@your-db-host:5432/croissantpay

# Production URL
BETTER_AUTH_URL=https://croissantpay.yourdomain.com

# Strong secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-very-long-random-secret-here

# Enable production mode
NODE_ENV=production`}
              />
            </div>
          </div>
        </section>

        {/* Webhooks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Webhook Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Configure Apple and Google to send webhook notifications to your instance.
          </p>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Apple App Store</h3>
              <p className="text-sm text-muted-foreground mb-2">
                In App Store Connect → App → App Store Server Notifications
              </p>
              <code className="text-sm bg-secondary px-3 py-1.5 rounded block">
                https://croissantpay.yourdomain.com/api/webhooks/apple
              </code>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Google Play</h3>
              <p className="text-sm text-muted-foreground mb-2">
                In Play Console → App → Monetization → Real-time notifications
              </p>
              <code className="text-sm bg-secondary px-3 py-1.5 rounded block">
                https://croissantpay.yourdomain.com/api/webhooks/google
              </code>
            </div>
          </div>
        </section>

        {/* Backup */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Backups</h2>
          <p className="text-muted-foreground mb-4">
            Set up automated database backups for production.
          </p>
          <CodeBlock
            title="backup.sh"
            code={`#!/bin/bash
# Daily PostgreSQL backup
DATE=$(date +%Y-%m-%d)
pg_dump $DATABASE_URL | gzip > "/backups/croissantpay-$DATE.sql.gz"

# Keep last 30 days
find /backups -name "croissantpay-*.sql.gz" -mtime +30 -delete`}
          />
        </section>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Keep your <code className="px-1 py-0.5 bg-secondary rounded">BETTER_AUTH_SECRET</code> secure and never commit it to git
                </li>
                <li>
                  • Store Apple/Google credentials securely, consider using a secrets manager
                </li>
                <li>
                  • Monitor disk space as webhook logs can grow over time
                </li>
                <li>
                  • Test your webhook endpoints after deployment
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <Link
            href="/docs/getting-started"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Quick Start
          </Link>
          <Link
            href="/docs/sdk/react-native"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            SDK Setup
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{title}</span>
        <button className="p-1.5 rounded hover:bg-background transition-colors text-muted-foreground hover:text-foreground">
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-foreground">{code}</code>
      </pre>
    </div>
  );
}

