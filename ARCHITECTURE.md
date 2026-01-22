# CroissantPay - RevenueCat Alternative

## 🎯 Overview

CroissantPay is an open-source in-app purchase and subscription management platform for React Native apps, supporting both iOS (App Store) and Android (Google Play).

**Two deployment options:**
- **CroissantPay Cloud** — Fully managed SaaS, start free, scale as you grow
- **Self-Hosted** — Run on your own infrastructure, unlimited everything, forever free

## 💰 Pricing (Cloud)

| Plan | Price | Subscribers | API Requests | Apps |
|------|-------|-------------|--------------|------|
| Free | $0/mo | 100 | 10K/mo | 1 |
| Starter | $29/mo | 1,000 | 100K/mo | 3 |
| Growth | $99/mo | 10,000 | 1M/mo | 10 |
| Scale | $299/mo | 100,000 | 10M/mo | Unlimited |
| Enterprise | Custom | Custom | Custom | Custom |

**Self-hosted is always free with no limits.**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CroissantPay Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Dashboard UI   │    │   Public API     │                   │
│  │   (Next.js)      │    │   (Next.js API)  │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌───────────────────────┐                              │
│           │   Better-Auth         │                              │
│           │   (Authentication)    │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   Business Logic      │                              │
│           │   - Receipt Validation│                              │
│           │   - Entitlements      │                              │
│           │   - Subscriptions     │                              │
│           └───────────┬───────────┘                              │
│                       │                                          │
│           ┌───────────▼───────────┐                              │
│           │   Drizzle ORM         │                              │
│           │   (PostgreSQL)        │                              │
│           └───────────────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          ▲                                    ▲
          │                                    │
          ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│   Apple App Store   │              │   Google Play Store │
│   - StoreKit 2      │              │   - Billing API v5  │
│   - Server Notifs   │              │   - RTDN Webhooks   │
└─────────────────────┘              └─────────────────────┘
          ▲                                    ▲
          │                                    │
          └──────────────┬─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  React Native SDK   │
              │  @croissantpay/react-    │
              │  native-purchases   │
              └─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Your Mobile App   │
              └─────────────────────┘
```

## 📦 Project Structure

```
crp/
├── apps/
│   └── web/                    # Next.js Dashboard & API
│       ├── app/
│       │   ├── (auth)/         # Auth pages (login, register)
│       │   ├── (dashboard)/    # Dashboard pages
│       │   ├── api/
│       │   │   ├── auth/       # Better-Auth routes
│       │   │   ├── v1/         # Public API v1
│       │   │   │   ├── receipts/
│       │   │   │   ├── subscribers/
│       │   │   │   ├── entitlements/
│       │   │   │   └── products/
│       │   │   └── webhooks/   # Store webhooks
│       │   │       ├── apple/
│       │   │       └── google/
│       │   └── layout.tsx
│       ├── lib/
│       │   ├── auth.ts         # Better-Auth config
│       │   ├── db/
│       │   │   ├── index.ts    # Drizzle client
│       │   │   └── schema.ts   # Database schema
│       │   ├── stores/
│       │   │   ├── apple.ts    # App Store integration
│       │   │   └── google.ts   # Play Store integration
│       │   └── utils/
│       └── components/
│
├── packages/
│   └── react-native-croissantpay/   # React Native SDK
│       ├── src/
│       │   ├── index.ts
│       │   ├── CroissantPay.ts      # Main SDK class
│       │   ├── types.ts
│       │   └── native/
│       │       ├── ios/        # Native iOS module
│       │       └── android/    # Native Android module
│       └── package.json
│
└── package.json                # Monorepo root
```

## 🗄️ Database Schema

### Core Tables

#### Organizations
- Companies/developers using CroissantPay
- Multi-tenant support

#### Apps
- iOS/Android apps registered
- Store credentials (API keys, certificates)

#### Products
- In-app products and subscriptions
- Linked to App Store / Play Store product IDs

#### Offerings
- Groups of products shown to users
- Organize products for paywalls

#### Entitlements
- Access rights granted by purchases
- Maps products → features

#### Subscribers
- End users in your app (identified by app_user_id)
- Cross-platform identity

#### Purchases
- Individual transactions
- Receipt data, validation status

#### Subscriptions
- Active subscription tracking
- Renewal dates, cancellation status

### Schema Relationships

```
Organization (1) ──── (N) Apps
App (1) ──── (N) Products
App (1) ──── (N) Offerings
Offering (N) ──── (N) Products (via OfferingProducts)
Product (N) ──── (N) Entitlements (via ProductEntitlements)
App (1) ──── (N) Subscribers
Subscriber (1) ──── (N) Purchases
Subscriber (1) ──── (N) Subscriptions
Purchase (N) ──── (1) Product
Subscription (N) ──── (1) Product
```

## 🔐 Authentication Flow

### Dashboard (Better-Auth)
1. Email/Password + OAuth (GitHub, Google)
2. Session-based auth with cookies
3. Organization membership & roles

### SDK/API Authentication
1. API Keys (public + secret)
2. Public key: client-side SDK (rate-limited)
3. Secret key: server-to-server (full access)

## 🔄 Receipt Validation Flow

### iOS (App Store)
```
1. User purchases in-app
2. React Native SDK receives StoreKit transaction
3. SDK sends receipt to CroissantPay API
4. CroissantPay validates with App Store Server API
5. Parse JWS transaction/renewal info
6. Update subscriber entitlements
7. Return entitlements to SDK
8. (Async) App Store sends Server Notifications for updates
```

### Android (Play Store)
```
1. User purchases in-app
2. React Native SDK receives purchase token
3. SDK sends purchase token to CroissantPay API
4. CroissantPay validates with Google Play Developer API
5. Acknowledge purchase (required by Google)
6. Update subscriber entitlements
7. Return entitlements to SDK
8. (Async) Google sends Real-time Developer Notifications
```

## 🎣 Webhook Handlers

### Apple App Store Server Notifications v2
- `SUBSCRIBED` - New subscription
- `DID_RENEW` - Subscription renewed
- `DID_FAIL_TO_RENEW` - Renewal failed
- `DID_CHANGE_RENEWAL_STATUS` - Auto-renew toggled
- `EXPIRED` - Subscription expired
- `REFUND` - Refund processed
- `GRACE_PERIOD_EXPIRED` - Grace period ended

### Google Play Real-time Developer Notifications
- `SUBSCRIPTION_PURCHASED` - New subscription
- `SUBSCRIPTION_RENEWED` - Subscription renewed
- `SUBSCRIPTION_RECOVERED` - Recovered from hold
- `SUBSCRIPTION_CANCELED` - User canceled
- `SUBSCRIPTION_ON_HOLD` - Payment on hold
- `SUBSCRIPTION_EXPIRED` - Subscription expired
- `SUBSCRIPTION_REVOKED` - Refund/chargeback

## 📊 API Endpoints

### Public API (SDK)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/receipts` | Validate & sync receipt |
| GET | `/api/v1/subscribers/:id` | Get subscriber info |
| GET | `/api/v1/subscribers/:id/entitlements` | Get entitlements |
| GET | `/api/v1/offerings` | Get current offerings |
| POST | `/api/v1/subscribers/:id/attributes` | Update attributes |

### Admin API (Dashboard)

| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/api/v1/apps` | Manage apps |
| CRUD | `/api/v1/products` | Manage products |
| CRUD | `/api/v1/offerings` | Manage offerings |
| CRUD | `/api/v1/entitlements` | Manage entitlements |
| POST | `/api/v1/entitlements/grant` | Manually grant entitlements |
| GET | `/api/v1/analytics/*` | Analytics data |

### Billing API (Cloud Mode)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing/checkout` | Create Stripe checkout |
| POST | `/api/billing/portal` | Create billing portal |
| GET | `/api/billing/usage` | Get usage & limits |

### Webhooks (Incoming from Stores)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/apple` | Apple Server Notifications v2 |
| POST | `/api/webhooks/google` | Google RTDN |
| POST | `/api/webhooks/stripe` | Stripe billing events |

### Webhooks (Outgoing to Customer Servers)

CroissantPay can send real-time events to your servers when subscription events occur.

**Configuration:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/apps/:id/webhook` | Configure webhook URL |
| GET | `/api/v1/apps/:id/webhook` | Get webhook config |
| PUT | `/api/v1/apps/:id/webhook` | Rotate webhook secret |
| POST | `/api/v1/apps/:id/webhook/test` | Send test webhook |

**Event Types:**
- `subscriber.created` / `subscriber.updated`
- `subscription.created` / `subscription.renewed` / `subscription.canceled` / `subscription.expired`
- `subscription.billing_issue` / `subscription.product_change`
- `entitlement.granted` / `entitlement.revoked`
- `purchase.completed` / `purchase.refunded`
- `trial.started` / `trial.converted` / `trial.expired`

**Payload Format:**
```json
{
  "id": "evt_abc123...",
  "type": "subscription.renewed",
  "timestamp": "2024-01-15T10:30:00Z",
  "appId": "app_xyz789...",
  "data": {
    "subscriberId": "sub_123...",
    "appUserId": "user_456",
    "productIdentifier": "pro_monthly",
    "expiresDate": "2024-02-15T10:30:00Z"
  }
}
```

**Security:** All webhooks are signed with HMAC-SHA256. Verify the `X-CroissantPay-Signature` header using your webhook secret.

## 🛠️ Tech Stack

### Backend
- **Framework**: Next.js 15 (App Router)
- **Auth**: Better-Auth
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Validation**: Zod
- **Payments**: Stripe (cloud billing)
- **Email**: Resend
- **API**: REST

### Dashboard UI
- **UI Framework**: React 19
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Icons**: Lucide React

### React Native SDK
- **Language**: TypeScript
- **iOS**: StoreKit 2 (Swift)
- **Android**: Google Play Billing v6 (Kotlin)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Apple Developer Account (for iOS)
- Google Play Console (for Android)

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Better-Auth
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000

# Apple App Store
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_BUNDLE_ID=

# Google Play
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_PACKAGE_NAME=
```

## 📈 Implementation Status

### ✅ Completed
- [x] Monorepo setup (pnpm workspaces)
- [x] Next.js 15 app with TypeScript
- [x] Better-Auth authentication
- [x] Drizzle ORM + PostgreSQL schema
- [x] Core database schema (organizations, apps, products, subscribers, etc.)
- [x] Billing schema for cloud mode
- [x] Apple App Store integration (StoreKit 2 Server API)
- [x] Google Play integration (Billing API v6)
- [x] Webhook handlers (Apple & Google)
- [x] Receipt validation service
- [x] Entitlements service
- [x] Subscriber management
- [x] API middleware with rate limiting
- [x] Usage tracking service
- [x] Stripe billing integration (cloud mode)
- [x] Email notifications (Resend)
- [x] Dashboard UI pages (apps, subscribers, products, analytics, settings)
- [x] Auth pages (login, register)
- [x] Landing page with pricing
- [x] Documentation pages
- [x] React Native SDK (@croissantpay/react-native)
- [x] iOS native module (Swift/StoreKit 2)
- [x] Android native module (Kotlin/Play Billing v6)
- [x] Docker deployment setup
- [x] Webhooks to customer servers
- [x] Subscription lifecycle management
- [x] Database seed script
- [x] Expo demo app

### 🔜 Future Enhancements
- [ ] Cohort analysis
- [ ] Team invitations UI
- [ ] Audit logs
- [ ] Integration with analytics (Amplitude, Mixpanel)
- [ ] Cross-platform paywalls
- [ ] React Native Turbo Modules migration

