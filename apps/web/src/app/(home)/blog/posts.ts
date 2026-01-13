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
    slug: "introducing-ab-testing",
    title: "Introducing A/B Testing for Offerings",
    excerpt: "Learn how to optimize your paywall conversion rates with our new A/B testing feature. Run experiments, track results, and make data-driven decisions.",
    date: "January 2, 2026",
    readTime: "5 min read",
    author: "CroissantPay Team",
    category: "Feature",
    content: `
We're thrilled to announce the launch of A/B testing for offerings in CroissantPay. This powerful feature allows you to experiment with different paywall configurations and optimize your conversion rates based on real data.

## Why A/B Testing Matters

In the world of mobile monetization, small changes can lead to significant revenue improvements. A/B testing enables you to:

- **Test different price points** - Find the optimal pricing that maximizes both conversions and revenue
- **Experiment with offerings** - Try different product combinations to see what resonates with users
- **Optimize paywall design** - Test copy, layout, and presentation to improve engagement

## How It Works

Setting up an A/B test in CroissantPay is straightforward:

1. **Create variants** - Define two or more offering configurations you want to test
2. **Set traffic allocation** - Decide what percentage of users see each variant
3. **Define success metrics** - Choose what you're optimizing for (conversion rate, revenue per user, etc.)
4. **Launch the experiment** - Start collecting data from real users
5. **Analyze results** - View statistically significant results in your dashboard

## Getting Started

To create your first A/B test:

\`\`\`typescript
// In your dashboard, navigate to Experiments
// Click "New Experiment" and select your offerings

// Or use the API:
const experiment = await croissantpay.experiments.create({
  name: "Pricing Test Q1",
  variants: [
    { offeringId: "offering_a", weight: 50 },
    { offeringId: "offering_b", weight: 50 },
  ],
  metrics: ["conversion_rate", "revenue_per_user"],
});
\`\`\`

## Best Practices

- **Run tests for sufficient duration** - We recommend at least 2 weeks to account for weekly patterns
- **Test one variable at a time** - This makes it easier to understand what's driving results
- **Set a minimum sample size** - Ensure statistical significance before making decisions
- **Document your hypotheses** - Keep track of what you expect and why

## What's Next

We're continuing to improve our experimentation platform with:

- Multi-armed bandit algorithms for faster optimization
- Cohort-based analysis
- Integration with external analytics tools

Start running your first experiment today and let data drive your monetization strategy!
    `,
  },
  {
    slug: "promo-codes-guide",
    title: "The Complete Guide to Promo Codes",
    excerpt: "Everything you need to know about creating and managing promotional codes. From percentage discounts to free trial extensions.",
    date: "December 28, 2025",
    readTime: "8 min read",
    author: "CroissantPay Team",
    category: "Tutorial",
    content: `
Promotional codes are a powerful tool for user acquisition, retention, and engagement. This guide covers everything you need to know about creating and managing promo codes in CroissantPay.

## Types of Promo Codes

CroissantPay supports several types of promotional offers:

### Percentage Discounts
Reduce the price by a percentage (e.g., 20% off).

\`\`\`typescript
const promoCode = await croissantpay.promoCodes.create({
  code: "SAVE20",
  type: "percentage",
  value: 20,
  maxRedemptions: 1000,
  expiresAt: "2026-03-31",
});
\`\`\`

### Fixed Amount Discounts
Reduce the price by a fixed amount (e.g., $5 off).

\`\`\`typescript
const promoCode = await croissantpay.promoCodes.create({
  code: "FIVE_OFF",
  type: "fixed",
  value: 500, // in cents
  currency: "USD",
});
\`\`\`

### Free Trial Extensions
Give users extra trial time.

\`\`\`typescript
const promoCode = await croissantpay.promoCodes.create({
  code: "EXTRATRIAL",
  type: "trial_extension",
  trialDays: 14,
});
\`\`\`

## Creating Promo Codes

### Via Dashboard

1. Navigate to **Promo Codes** in your dashboard
2. Click **Create Promo Code**
3. Choose your discount type and value
4. Set optional limits (max redemptions, expiry date, eligible products)
5. Click **Create**

### Via API

\`\`\`typescript
const response = await fetch('/api/v1/promo-codes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: "WELCOME50",
    type: "percentage",
    value: 50,
    maxRedemptions: 500,
    applicableProducts: ["premium_monthly", "premium_annual"],
    firstTimeOnly: true,
  }),
});
\`\`\`

## Bulk Generation

Need to create many codes at once? Use our bulk generation feature:

\`\`\`typescript
const codes = await croissantpay.promoCodes.bulkCreate({
  prefix: "PARTNER_",
  count: 100,
  type: "percentage",
  value: 25,
  singleUse: true,
});
// Creates: PARTNER_A1B2C3, PARTNER_D4E5F6, ...
\`\`\`

## Redemption in Your App

When a user enters a promo code in your app:

\`\`\`typescript
import { CroissantPay } from '@croissantpay/react-native';

const redeemPromoCode = async (code: string) => {
  try {
    const result = await CroissantPay.redeemPromoCode(code);
    
    if (result.success) {
      // Show success message
      Alert.alert('Success', \`Code applied: \${result.discount}\`);
    }
  } catch (error) {
    // Handle invalid or expired code
    Alert.alert('Error', 'Invalid promo code');
  }
};
\`\`\`

## Tracking & Analytics

Monitor your promo code performance:

- **Redemption rate** - How many codes are being used
- **Revenue impact** - Total discounts given vs. incremental revenue
- **User segments** - Who's using promo codes
- **Conversion lift** - Do promo codes improve conversion?

## Best Practices

1. **Set expiry dates** - Create urgency and limit exposure
2. **Use unique codes for partnerships** - Track performance by source
3. **Limit redemptions per user** - Prevent abuse
4. **A/B test discount amounts** - Find the optimal discount level
5. **Monitor fraud patterns** - Watch for unusual redemption patterns

Happy promoting! 🎉
    `,
  },
  {
    slug: "migrating-from-revenuecat",
    title: "Migrating from RevenueCat to CroissantPay",
    excerpt: "A step-by-step guide to migrating your existing RevenueCat integration to CroissantPay. Keep your subscribers and data intact.",
    date: "December 20, 2025",
    readTime: "12 min read",
    author: "CroissantPay Team",
    category: "Tutorial",
    content: `
Thinking about switching from RevenueCat to CroissantPay? This comprehensive guide will walk you through the migration process step by step, ensuring you don't lose any subscribers or historical data.

## Why Migrate?

Before we dive in, here's why teams choose CroissantPay:

- **Open source** - Full visibility and control over your payment infrastructure
- **No revenue share** - Pay a flat fee, not a percentage of your revenue
- **Self-hosting option** - Keep all data on your own servers
- **Modern stack** - Built with the latest technologies

## Pre-Migration Checklist

Before starting, ensure you have:

- [ ] Access to your RevenueCat dashboard
- [ ] Your RevenueCat API keys (for data export)
- [ ] A CroissantPay account set up
- [ ] Test environment configured

## Step 1: Set Up CroissantPay

First, create your app in CroissantPay:

\`\`\`typescript
// 1. Create your app in the CroissantPay dashboard
// 2. Configure your store credentials:
//    - iOS: App Store Connect API key
//    - Android: Google Play service account

// 3. Set up products matching your RevenueCat configuration
\`\`\`

## Step 2: Map Your Products

Create corresponding products in CroissantPay:

| RevenueCat | CroissantPay |
|------------|--------------|
| Product ID | Store Product ID |
| Entitlement | Entitlement |
| Offering | Offering |

## Step 3: Export Subscriber Data

Export your existing subscribers from RevenueCat:

\`\`\`bash
# Use the RevenueCat export API or dashboard export
curl -X GET "https://api.revenuecat.com/v1/subscribers/export" \\
  -H "Authorization: Bearer $REVENUECAT_API_KEY" \\
  > subscribers.json
\`\`\`

## Step 4: Import to CroissantPay

Import your subscriber data:

\`\`\`typescript
// Use our migration tool
const migration = await croissantpay.migrations.import({
  source: 'revenuecat',
  data: subscriberData,
  options: {
    preserveOriginalIds: true,
    validateReceipts: true,
  },
});

console.log(\`Imported \${migration.imported} subscribers\`);
\`\`\`

## Step 5: Update Your App

Replace the RevenueCat SDK with CroissantPay:

**Before (RevenueCat):**
\`\`\`typescript
import Purchases from 'react-native-purchases';

Purchases.configure({ apiKey: 'rc_xxx' });
const { customerInfo } = await Purchases.getCustomerInfo();
\`\`\`

**After (CroissantPay):**
\`\`\`typescript
import { CroissantPay } from '@croissantpay/react-native';

CroissantPay.configure({ apiKey: 'mx_xxx' });
const subscriberInfo = await CroissantPay.getSubscriberInfo();
\`\`\`

## Step 6: Test Thoroughly

Before going live:

1. **Test new purchases** - Ensure new subscriptions work correctly
2. **Test restore** - Verify existing subscribers can restore purchases
3. **Test entitlements** - Confirm access control works as expected
4. **Test webhooks** - Verify your server receives events

## Step 7: Go Live

Deploy your updated app and switch your backend:

1. Deploy the new app version
2. Update webhook endpoints to CroissantPay
3. Monitor for any issues
4. Keep RevenueCat in read-only mode for a transition period

## Rollback Plan

If issues arise:

\`\`\`typescript
// CroissantPay supports dual-running during migration
// You can verify data against both systems

const croissantpayInfo = await CroissantPay.getSubscriberInfo();
const revenuecatInfo = await Purchases.getCustomerInfo();

// Compare entitlements
validateMigration(croissantpayInfo, revenuecatInfo);
\`\`\`

## Common Issues & Solutions

### Missing Subscribers
- Ensure you exported all subscribers, including those with expired subscriptions
- Check for app user ID format differences

### Entitlement Mismatches
- Verify your entitlement mapping is correct
- Check for products with multiple entitlements

### Webhook Failures
- Update your server to handle CroissantPay webhook format
- Test with our webhook testing tool

## Need Help?

Our migration support team is here to help:
- Email: migrations@croissantpay.dev
- Discord: Join our #migrations channel

We've helped hundreds of apps migrate successfully—you're in good hands!
    `,
  },
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

1. **A/B test price points** - Test $9.99 vs $12.99 vs $14.99
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

Use CroissantPay's A/B testing to experiment with pricing:

\`\`\`typescript
const experiment = await CroissantPay.createExperiment({
  name: "Price Test",
  variants: [
    { offering: "price_a", weight: 50 }, // $9.99
    { offering: "price_b", weight: 50 }, // $12.99
  ],
});
\`\`\`

Remember: the "right" price is the one that maximizes your business goals, whether that's revenue, user growth, or market share.
    `,
  },
  {
    slug: "self-hosting-production",
    title: "Self-Hosting CroissantPay in Production",
    excerpt: "Best practices for running CroissantPay on your own infrastructure. Covers Docker, Kubernetes, monitoring, and scaling.",
    date: "December 10, 2025",
    readTime: "15 min read",
    author: "CroissantPay Team",
    category: "Tutorial",
    content: `
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
helm repo add croissantpay https://charts.croissantpay.dev
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

- Documentation: https://docs.croissantpay.dev/self-hosted
- GitHub Issues: https://github.com/croissantpay/croissantpay/issues
- Discord: https://discord.gg/croissantpay

Happy self-hosting! 🚀
    `,
  },
  {
    slug: "announcing-croissantpay",
    title: "Announcing CroissantPay: Open-Source IAP Management",
    excerpt: "We're excited to announce CroissantPay, the open-source alternative to RevenueCat. Learn about our mission and what makes us different.",
    date: "December 1, 2025",
    readTime: "6 min read",
    author: "CroissantPay Team",
    category: "Announcement",
    content: `
Today, we're thrilled to publicly announce CroissantPay—an open-source platform for managing in-app purchases and subscriptions in React Native apps.

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
- **A/B testing** - Optimize your paywalls with experiments
- **Promo codes** - Create and manage promotional offers

## Open Source at Heart

CroissantPay is fully open source under the MIT license. This means:

- **Inspect the code** - See exactly how everything works
- **Self-host for free** - Run on your own infrastructure with no limits
- **Contribute** - Help shape the future of the project
- **No vendor lock-in** - Your data, your control

## Cloud or Self-Hosted

Choose what works for you:

### CroissantPay Cloud
Managed hosting with:
- Zero maintenance
- Automatic updates
- 99.9% uptime SLA
- Priority support (paid plans)

### Self-Hosted
Run on your own servers:
- 100% free, forever
- No usage limits
- Complete data control
- Docker & Kubernetes ready

## Simple Pricing

We believe in transparent, predictable pricing:

- **No revenue share** - We never take a cut of your revenue
- **Flat monthly fee** - Know exactly what you'll pay
- **Free tier** - Get started without a credit card
- **Self-host for free** - Always an option

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
- 📖 Read the [Documentation](https://docs.croissantpay.dev)
- 🐛 Report [Issues](https://github.com/croissantpay/croissantpay/issues)

## What's Next

This is just the beginning. Our roadmap includes:

- Native iOS and Android SDKs
- Flutter support
- Advanced analytics
- More A/B testing features
- Enterprise features

## Thank You

We're grateful to everyone who helped make this launch possible—our early adopters, beta testers, and the open-source community.

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
