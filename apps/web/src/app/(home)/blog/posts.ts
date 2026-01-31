export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  category: "Feature" | "Tutorial" | "Strategy" | "Announcement";
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "subscription-pricing-strategies",
    title: "Subscription Pricing Strategies That Work",
    excerpt: "Learn proven pricing strategies for mobile subscriptions. From free trials to annual discounts, find what works for your app.",
    date: "December 15, 2025",
    readTime: "10 min read",
    author: "CroissantPay Team",
    category: "Strategy",
    content: `
Pricing is one of the most important decisions you'll make for your subscription app. Get it right, and you'll maximize both user acquisition and lifetime value. Get it wrong, and you'll leave money on the table.

## The Psychology of Subscription Pricing

Understanding user psychology is key to effective pricing:

- **Anchoring** - Users compare prices to reference points
- **Loss aversion** - People feel losses more strongly than gains
- **Decision fatigue** - Too many options lead to no choice
- **Social proof** - Users look to others for validation

## Common Pricing Models

### 1. Freemium
Offer basic features for free, premium features for subscribers.

**Pros:**
- Low barrier to entry
- Large user base for monetization
- Word-of-mouth growth

**Cons:**
- Many users never convert
- Need to balance free vs. paid features
- Higher support costs

### 2. Free Trial
Let users experience premium features before committing.

**Best practices:**
- 7-day trials typically outperform 30-day trials
- Require payment method upfront for better conversion
- Send reminder emails before trial ends

\`\`\`typescript
// Configure trial in your offering
const offering = {
  products: [{
    identifier: "premium_monthly",
    trialDays: 7,
    price: 9.99,
  }],
};
\`\`\`

### 3. Tiered Pricing
Offer multiple subscription levels at different price points.

| Tier | Price | Features |
|------|-------|----------|
| Basic | $4.99/mo | Core features |
| Pro | $9.99/mo | Advanced features |
| Business | $24.99/mo | Everything + team features |

**Tip:** Most users choose the middle option (decoy effect).

## Monthly vs. Annual Pricing

Annual subscriptions offer significant advantages:

- **Higher LTV** - Users commit for longer
- **Lower churn** - Annual subscribers have 3-4x lower churn
- **Better cash flow** - Revenue upfront

**Recommended discount:** 15-20% off for annual (equivalent to 2 months free).

\`\`\`typescript
const offerings = {
  monthly: { price: 9.99, period: "month" },
  annual: { price: 79.99, period: "year" }, // ~33% savings
};
\`\`\`

## Price Localization

Different markets have different price sensitivities:

- **Tier 1 markets** (US, UK, EU) - Can sustain premium pricing
- **Tier 2 markets** (Latin America, Eastern Europe) - 30-50% lower pricing
- **Tier 3 markets** (India, SEA) - 50-70% lower pricing

CroissantPay supports automatic price localization:

\`\`\`typescript
const product = {
  basePrice: 9.99,
  currency: "USD",
  localizations: {
    IN: { price: 199, currency: "INR" },
    BR: { price: 19.90, currency: "BRL" },
  },
};
\`\`\`

## Testing Your Pricing

Never guess—always test:

1. **Test price points** - Test $9.99 vs $12.99 vs $14.99
2. **Test trial lengths** - Compare 3-day vs 7-day vs 14-day
3. **Test annual discounts** - Find the optimal savings percentage
4. **Test paywall copy** - Words matter as much as price

## Pricing Optimization Tips

1. **End in .99** - Classic but still works
2. **Show savings** - "Save 33% with annual"
3. **Use social proof** - "Join 100,000+ subscribers"
4. **Create urgency** - Limited-time offers
5. **Reduce friction** - One-click purchase

## Measuring Success

Key metrics to track:

- **Conversion rate** - % of users who subscribe
- **ARPU** - Average revenue per user
- **LTV** - Lifetime value of a subscriber
- **Payback period** - Time to recoup acquisition cost

## Get Started

Start experimenting with different price points by creating multiple offerings in your CroissantPay dashboard. Track conversion rates and revenue metrics to find the optimal pricing for your app.

Remember: the "right" price is the one that maximizes your business goals, whether that's revenue, user growth, or market share.
    `,
  },
  {
    slug: "self-hosting-production",
    title: "Self-Hosting CroissantPay in Production (coming soon)",
    excerpt: "Self-hosting is coming soon. Best practices for running CroissantPay on your own infrastructure. Covers Docker, Kubernetes, monitoring, and scaling.",
    date: "December 10, 2025",
    readTime: "15 min read",
    author: "CroissantPay Team",
    category: "Tutorial",
    content: `
> **Note:** Self-hosting is coming soon. This guide will be fully applicable when we launch. For now, use CroissantPay Cloud.

Running CroissantPay on your own infrastructure gives you complete control over your data and removes any usage-based pricing. This guide covers everything you need to know to deploy CroissantPay in production.

## Prerequisites

Before starting, you'll need:

- Docker and Docker Compose (or Kubernetes)
- PostgreSQL 14+ database
- Redis for caching (optional but recommended)
- A domain with SSL certificate

## Quick Start with Docker Compose

The fastest way to get started:

\`\`\`bash
# Clone the repository
git clone https://github.com/croissantpay/croissantpay.git
cd croissantpay

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the services
docker compose up -d
\`\`\`

Your \`.env\` file should include:

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@db:5432/croissantpay

# Redis (optional)
REDIS_URL=redis://redis:6379

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here

# App Store Connect (for iOS)
APPLE_ISSUER_ID=xxx
APPLE_KEY_ID=xxx
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Google Play (for Android)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
\`\`\`

## Production Architecture

For production, we recommend:

\`\`\`
                    ┌─────────────┐
                    │   Load      │
                    │   Balancer  │
                    └─────┬───────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
      │  App (1)  │ │  App (2)  │ │  App (3)  │
      └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
            │             │             │
            └─────────────┼─────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
      ┌─────▼─────┐ ┌─────▼─────┐       │
      │ PostgreSQL│ │   Redis   │       │
      │  Primary  │ │  Cluster  │       │
      └───────────┘ └───────────┘       │
\`\`\`

## Kubernetes Deployment

For Kubernetes, use our Helm chart:

\`\`\`bash
# Add the CroissantPay Helm repository
helm repo add croissantpay https://charts.croissantlabs.com
helm repo update

# Install CroissantPay
helm install croissantpay croissantpay/croissantpay \\
  --namespace croissantpay \\
  --create-namespace \\
  --set database.url="postgresql://..." \\
  --set replicas=3
\`\`\`

Example \`values.yaml\`:

\`\`\`yaml
replicas: 3

image:
  repository: croissantpay/croissantpay
  tag: latest

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

database:
  url: postgresql://user:pass@postgres:5432/croissantpay

redis:
  enabled: true
  url: redis://redis:6379

ingress:
  enabled: true
  hostname: api.yourapp.com
  tls: true
\`\`\`

## Database Setup

### PostgreSQL Configuration

For production PostgreSQL:

\`\`\`sql
-- Recommended settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
\`\`\`

### Migrations

Run database migrations:

\`\`\`bash
# Using Docker
docker exec -it croissantpay npx drizzle-kit migrate

# Or directly
pnpm db:migrate
\`\`\`

## Monitoring & Observability

### Health Checks

CroissantPay exposes health endpoints:

\`\`\`bash
# Liveness probe
curl http://localhost:3000/api/health

# Readiness probe  
curl http://localhost:3000/api/health/ready
\`\`\`

### Metrics

Enable Prometheus metrics:

\`\`\`bash
METRICS_ENABLED=true
METRICS_PORT=9090
\`\`\`

### Logging

Configure structured logging:

\`\`\`bash
LOG_LEVEL=info
LOG_FORMAT=json
\`\`\`

## Security Best Practices

1. **Use secrets management** - Never commit secrets to git
2. **Enable SSL/TLS** - Always use HTTPS in production
3. **Set up firewalls** - Restrict database access
4. **Regular updates** - Keep CroissantPay and dependencies updated
5. **Backup regularly** - Automate database backups

\`\`\`bash
# Example backup script
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
\`\`\`

## Scaling

### Horizontal Scaling

CroissantPay is stateless and scales horizontally:

\`\`\`bash
# Docker Compose
docker compose up -d --scale app=5

# Kubernetes
kubectl scale deployment croissantpay --replicas=5
\`\`\`

### Database Scaling

For high traffic:

- Use read replicas for read-heavy workloads
- Consider connection pooling with PgBouncer
- Implement database sharding for very large datasets

## Troubleshooting

### Common Issues

**Database connection errors:**
\`\`\`bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"
\`\`\`

**High memory usage:**
\`\`\`bash
# Check Node.js memory
docker stats croissantpay
\`\`\`

**Slow queries:**
\`\`\`sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
\`\`\`

## Getting Help

- Documentation: https://docs.croissantlabs.com/self-hosted
- GitHub Issues: https://github.com/croissantpay/croissantpay/issues
- Discord: https://discord.gg/croissantpay

Happy self-hosting! 🚀
    `,
  },
  {
    slug: "announcing-croissantpay",
    title: "Announcing CroissantPay: IAP Management (Open Source Coming Soon)",
    excerpt: "We're excited to announce CroissantPay, a platform for in-app purchases. Open source is coming—learn about our mission and what makes us different.",
    date: "December 1, 2025",
    readTime: "6 min read",
    author: "CroissantPay Team",
    category: "Announcement",
    content: `
> **Note:** We're still working on the open-source release. The code will be published under MIT when it's ready. For now, CroissantPay Cloud is available.

Today, we're thrilled to publicly announce CroissantPay—a platform for managing in-app purchases and subscriptions in React Native apps. We're going open source; it's coming soon.

## Why We Built CroissantPay

As mobile developers ourselves, we've experienced the frustration of integrating in-app purchases. The existing solutions are either:

- **Too expensive** - Taking a percentage of revenue on top of Apple/Google's cut
- **Too complex** - Requiring extensive setup and maintenance
- **Too closed** - No visibility into how your payment infrastructure works

We believed there had to be a better way.

## What is CroissantPay?

CroissantPay is a complete solution for managing subscriptions and in-app purchases:

### For Your App
- **React Native SDK** - Type-safe, easy-to-use SDK with hooks
- **Receipt validation** - Server-side validation for iOS and Android
- **Entitlements** - Simple access control based on purchases
- **Cross-platform** - Single subscriber identity across platforms

### For Your Business
- **Analytics dashboard** - Track MRR, churn, LTV, and more
- **Real-time webhooks** - Never miss a subscription event
- **Offerings management** - Organize products for your paywalls

## Open Source Coming Soon

We're working on making CroissantPay fully open source under the MIT license. When we launch, this will mean:

- **Inspect the code** - See exactly how everything works
- **Self-host for free (coming soon)** - Run on your own infrastructure with no limits
- **Contribute** - Help shape the future of the project
- **No vendor lock-in** - Your data, your control

In the meantime, CroissantPay Cloud is available and we're building in the open.

## Cloud or Self-Hosted

Choose what works for you:

### CroissantPay Cloud
Managed hosting with:
- Zero maintenance
- Automatic updates
- 99.9% uptime SLA
- Priority support (paid plans)

### Self-Hosted (coming soon)
When we launch, run on your own servers:
- 100% free, forever
- No usage limits
- Complete data control
- Docker & Kubernetes ready

## Simple Pricing

We believe in transparent, predictable pricing:

- **No revenue share** - We never take a cut of your revenue
- **Flat monthly fee** - Know exactly what you'll pay
- **Free tier** - Get started without a credit card
- **Self-host for free (coming soon)** - Always an option when we launch

## Getting Started

It takes just a few minutes to integrate CroissantPay:

\`\`\`typescript
import { CroissantPay } from '@croissantpay/react-native';

// Initialize
CroissantPay.configure({
  apiKey: 'mx_public_xxx',
});

// Identify user
await CroissantPay.identify('user_123');

// Check entitlements
const { entitlements } = await CroissantPay.getSubscriberInfo();
if (entitlements.premium?.isActive) {
  // Grant access
}

// Make a purchase
const result = await CroissantPay.purchase('premium_monthly');
\`\`\`

## Join Our Community

We're building CroissantPay in the open and welcome contributions:

- ⭐ Star us on [GitHub](https://github.com/croissantpay/croissantpay)
- 💬 Join our [Discord](https://discord.gg/croissantpay)
- 📖 Read the [Documentation](https://docs.croissantlabs.com)
- 🐛 Report [Issues](https://github.com/croissantpay/croissantpay/issues)

## What's Next

This is just the beginning. Our roadmap includes:

- Native iOS and Android SDKs
- Flutter support
- Advanced analytics
- Enterprise features

## Thank You

We're grateful to everyone who helped make this launch possible—our early adopters, beta testers, and everyone excited for our open-source release.

Ready to take control of your in-app purchases? [Get started today](/register).

À bientôt! 🥐
    `,
  },
];

export const categories = ["All", "Feature", "Tutorial", "Strategy", "Announcement"] as const;

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "All") return posts;
  return posts.filter((post) => post.category === category);
}
