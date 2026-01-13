# CroissantPay 📱

**Open-source RevenueCat alternative for React Native** — Self-host for free or use our managed cloud.

![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## 🚀 Two Ways to Deploy

| | **CroissantPay Cloud** | **Self-Hosted** |
|---|---|---|
| **Pricing** | Free tier, then $29-299/mo | Forever free |
| **Setup** | Instant | 5 minutes |
| **Limits** | Based on plan | Unlimited |
| **Updates** | Automatic | Manual |
| **Support** | Priority available | Community |
| **Data** | Our servers | Your servers |

**[Start with Cloud →](https://croissantpay.dev)** or **[Self-Host →](#self-hosting)**

## ✨ Features

- 🔐 **Server-side receipt validation** for iOS App Store & Google Play
- 📊 **Real-time webhooks** for subscription lifecycle events
- 🎯 **Entitlement-based access control** - define once, use everywhere
- 📱 **Cross-platform subscriber identity** - iOS & Android unified
- 🚀 **TypeScript React Native SDK** with hooks
- 📈 **Analytics dashboard** - MRR, churn, LTV, and more
- 🔑 **Better-Auth integration** - secure admin authentication
- 🗄️ **Drizzle ORM** with PostgreSQL
- ☁️ **Cloud or Self-hosted** - your choice, same features

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your App                                │
│                   (React Native + SDK)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CroissantPay Server                             │
│                    (Next.js + Drizzle)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Receipt validation          • Entitlement management        │
│  • Subscriber tracking         • Webhook processing            │
│  • Product management          • Analytics                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌─────────────────────┐      ┌─────────────────────┐
    │   Apple App Store   │      │   Google Play Store │
    │   Server API        │      │   Developer API     │
    └─────────────────────┘      └─────────────────────┘
```

## 💰 Cloud Pricing

| Plan | Price | Subscribers | API Requests | Apps |
|------|-------|-------------|--------------|------|
| **Free** | $0/mo | 100 | 10K/mo | 1 |
| **Starter** | $29/mo | 1,000 | 100K/mo | 3 |
| **Growth** | $99/mo | 10,000 | 1M/mo | 10 |
| **Scale** | $299/mo | 100,000 | 10M/mo | Unlimited |
| **Enterprise** | Custom | Custom | Custom | Custom |

No revenue share. No hidden fees. Self-hosting is always free.

---

## 🚀 Quick Start (Self-Hosting)

<a name="self-hosting"></a>

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm 9+

### 1. Clone and Install

```bash
git clone https://github.com/croissantpay/crp.git
cd crp
pnpm install
```

### 2. Set up environment

```bash
cp apps/web/.env.example apps/web/.env
# Edit .env with your database and API credentials
```

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/croissantpay

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Apple App Store Connect (optional, for iOS)
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# Google Play Developer API (optional, for Android)
GOOGLE_SERVICE_ACCOUNT_KEY=
```

### 3. Initialize database

```bash
cd apps/web
pnpm db:push
```

### 4. Seed demo data (optional)

```bash
pnpm db:seed
```

This creates a demo user (demo@croissantpay.dev / demo123) with sample products, subscribers, and subscriptions.

### 5. Start development server

```bash
pnpm dev
```

Visit `http://localhost:3000` to access the dashboard.

### Docker Deployment (Recommended)

The easiest way to self-host CroissantPay:

```bash
# Clone the repository
git clone https://github.com/croissantpay/croissantpay.git
cd croissantpay

# Start with Docker Compose
docker compose up -d
```

That's it! CroissantPay will be available at `http://localhost:3000`.

#### Environment Variables

Create a `.env` file for production:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/croissantpay
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars

# Deployment mode (self-hosted or cloud)
CROISSANTPAY_DEPLOYMENT_MODE=self-hosted

# Apple App Store (optional)
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# Google Play (optional)
GOOGLE_SERVICE_ACCOUNT_KEY=
```

## 📱 React Native Integration

### Install the SDK

```bash
npm install @croissantpay/react-native
# or
yarn add @croissantpay/react-native
```

### Configure in your app

```tsx
import { CroissantPayProvider, usePurchases } from '@croissantpay/react-native';

function App() {
  return (
    <CroissantPayProvider
      config={{
        apiKey: 'mx_public_your_key',
        // For cloud: https://api.croissantpay.dev
        // For self-hosted: your server URL
        apiUrl: 'https://api.croissantpay.dev',
        appUserId: 'user_123',
      }}
    >
      <MyApp />
    </CroissantPayProvider>
  );
}

function PaywallScreen() {
  const { offerings, purchase, hasEntitlement, isLoading } = usePurchases();

  if (hasEntitlement('premium')) {
    return <PremiumContent />;
  }

  const products = offerings?.offerings[offerings.currentOfferingId!]?.products;

  return (
    <View>
      <Text>Unlock Premium</Text>
      {products?.map((product) => (
        <Button
          key={product.identifier}
          title={`${product.displayName} - ${product.priceString}`}
          onPress={() => purchase(product.identifier)}
          disabled={isLoading}
        />
      ))}
    </View>
  );
}
```

## 🔧 API Reference

### Public API (for SDK)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/receipts` | Validate receipt & sync |
| GET | `/api/v1/subscribers/:id` | Get subscriber info |
| GET | `/api/v1/subscribers/:id/entitlements` | Get entitlements |
| GET | `/api/v1/offerings` | Get current offerings |
| POST | `/api/v1/subscribers/:id/attributes` | Update attributes |

### Webhook Endpoints

| Platform | Endpoint |
|----------|----------|
| Apple | `/api/webhooks/apple` |
| Google | `/api/webhooks/google` |

## 🗄️ Database Schema

CroissantPay uses Drizzle ORM with PostgreSQL. Key tables:

- **organizations** - Multi-tenant support
- **apps** - Your mobile applications
- **products** - In-app products & subscriptions
- **entitlements** - Access rights
- **offerings** - Product groups for paywalls
- **subscribers** - Your app users
- **subscriptions** - Active subscription tracking
- **purchases** - Transaction records

Run `pnpm db:studio` to explore your data.

### Database Commands

```bash
# Push schema changes to database
pnpm db:push

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database browser)
pnpm db:studio

# Seed demo data
pnpm db:seed
```

## 🔐 Store Configuration

### Apple App Store

1. Create an API key in App Store Connect
2. Download the `.p8` private key
3. Configure in CroissantPay dashboard or environment:
   - Issuer ID
   - Key ID
   - Private Key (contents of .p8 file)
4. Set up Server Notifications to `https://your-domain.com/api/webhooks/apple`

### Google Play

1. Create a service account in Google Cloud Console
2. Grant access in Google Play Console
3. Configure in CroissantPay:
   - Service Account JSON
   - Package Name
4. Set up Real-time Developer Notifications with Pub/Sub

## 📊 Dashboard Features

- **Overview** - MRR, active subscribers, churn rate
- **Apps** - Manage multiple applications
- **Products** - Configure products & entitlements
- **Subscribers** - Search and view subscriber details
- **Webhooks** - Monitor incoming events
- **Settings** - API keys, team management

## 🛣️ Roadmap

- [x] Core receipt validation (iOS StoreKit 2, Android Play Billing v6)
- [x] Subscriber management
- [x] Entitlements system
- [x] React Native SDK with hooks
- [x] Dashboard UI with real-time analytics
- [x] Stripe billing integration (cloud mode)
- [x] Email notifications (Resend)
- [x] Rate limiting & usage tracking
- [x] Subscription lifecycle management
- [x] Docker deployment
- [x] Expo demo app
- [ ] A/B testing for paywalls
- [ ] Promo codes
- [ ] Cohort analysis
- [ ] Integrations (Amplitude, Mixpanel)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guide.

## 📄 License

MIT © CroissantPay

---

**Built with ❤️ as an open-source alternative to RevenueCat**

