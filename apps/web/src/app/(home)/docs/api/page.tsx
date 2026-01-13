import Link from "next/link";
import {
  Smartphone,
  ArrowLeft,
  Key,
  User,
  Package,
  Receipt,
  Gift,
  FlaskConical,
  Webhook,
  AlertCircle,
  Copy,
  CheckCircle,
} from "lucide-react";

export default function ApiReferencePage() {
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
              ← Back to Docs
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
          <nav className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Getting Started
              </h3>
              <ul className="space-y-1">
                <SidebarLink href="#authentication">Authentication</SidebarLink>
                <SidebarLink href="#base-url">Base URL</SidebarLink>
                <SidebarLink href="#errors">Error Handling</SidebarLink>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Endpoints
              </h3>
              <ul className="space-y-1">
                <SidebarLink href="#receipts">Receipts</SidebarLink>
                <SidebarLink href="#subscribers">Subscribers</SidebarLink>
                <SidebarLink href="#entitlements">Entitlements</SidebarLink>
                <SidebarLink href="#offerings">Offerings</SidebarLink>
                <SidebarLink href="#products">Products</SidebarLink>
                <SidebarLink href="#promo-codes">Promo Codes</SidebarLink>
                <SidebarLink href="#experiments">Experiments</SidebarLink>
                <SidebarLink href="#webhooks">Webhooks</SidebarLink>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Complete reference for the CroissantPay REST API. All endpoints require authentication.
          </p>

          {/* Authentication */}
          <section id="authentication" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Key className="w-6 h-6 text-primary" />
              Authentication
            </h2>
            <p className="text-muted-foreground mb-4">
              All API requests require authentication using an API key. Include your API key in the
              <code className="mx-1 px-2 py-0.5 rounded bg-secondary text-sm">X-API-Key</code>
              header.
            </p>
            <CodeBlock
              title="Example Request"
              language="bash"
              code={`curl -X GET "https://api.croissantpay.dev/v1/subscribers/user_123" \\
  -H "X-API-Key: mx_live_your_api_key" \\
  -H "Content-Type: application/json"`}
            />
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Important:</strong> Keep your API keys secure. Never expose them in client-side code.
                Use the public key (<code>mx_public_*</code>) for the SDK and the secret key (<code>mx_live_*</code>) for server-side requests.
              </p>
            </div>
          </section>

          {/* Base URL */}
          <section id="base-url" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">Base URL</h2>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="font-mono text-sm">
                <span className="text-muted-foreground">Cloud:</span>{" "}
                <code className="text-primary">https://api.croissantpay.dev/v1</code>
              </p>
              <p className="font-mono text-sm mt-2">
                <span className="text-muted-foreground">Self-hosted:</span>{" "}
                <code className="text-primary">https://your-domain.com/api/v1</code>
              </p>
            </div>
          </section>

          {/* Error Handling */}
          <section id="errors" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-primary" />
              Error Handling
            </h2>
            <p className="text-muted-foreground mb-4">
              The API uses standard HTTP status codes and returns errors in a consistent JSON format.
            </p>
            <CodeBlock
              title="Error Response"
              language="json"
              code={`{
  "error": "INVALID_RECEIPT",
  "message": "The receipt could not be validated",
  "code": 400
}`}
            />
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Common Error Codes</h3>
              <div className="space-y-2">
                <ErrorCode code={400} name="Bad Request" description="Invalid parameters or malformed request" />
                <ErrorCode code={401} name="Unauthorized" description="Missing or invalid API key" />
                <ErrorCode code={403} name="Forbidden" description="Insufficient permissions" />
                <ErrorCode code={404} name="Not Found" description="Resource not found" />
                <ErrorCode code={429} name="Rate Limited" description="Too many requests" />
                <ErrorCode code={500} name="Server Error" description="Internal server error" />
              </div>
            </div>
          </section>

          {/* Receipts */}
          <section id="receipts" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              Receipts
            </h2>
            <p className="text-muted-foreground mb-6">
              Validate and process purchase receipts from the App Store and Google Play.
            </p>

            <Endpoint
              method="POST"
              path="/receipts"
              description="Validate a purchase receipt and grant entitlements"
              requestBody={`{
  "appUserId": "user_123",
  "platform": "ios",
  "receipt": "base64_encoded_receipt_data",
  "productId": "com.app.premium_monthly"
}`}
              responseBody={`{
  "success": true,
  "subscriber": {
    "id": "sub_abc123",
    "appUserId": "user_123",
    "entitlements": ["premium"],
    "activeSubscriptions": [{
      "productId": "com.app.premium_monthly",
      "expiresAt": "2024-02-15T00:00:00Z",
      "isActive": true
    }]
  }
}`}
            />
          </section>

          {/* Subscribers */}
          <section id="subscribers" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              Subscribers
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage subscriber data, entitlements, and subscription status.
            </p>

            <Endpoint
              method="GET"
              path="/subscribers/:appUserId"
              description="Get subscriber information including active entitlements"
              responseBody={`{
  "subscriber": {
    "id": "sub_abc123",
    "appUserId": "user_123",
    "email": "user@example.com",
    "entitlements": {
      "premium": {
        "isActive": true,
        "expiresAt": "2024-02-15T00:00:00Z",
        "productId": "com.app.premium_monthly"
      }
    },
    "subscriptions": [{
      "productId": "com.app.premium_monthly",
      "status": "active",
      "platform": "ios",
      "expiresAt": "2024-02-15T00:00:00Z"
    }],
    "attributes": {
      "custom_key": "custom_value"
    }
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/subscribers/:appUserId/attributes"
              description="Update subscriber custom attributes"
              requestBody={`{
  "attributes": {
    "referral_code": "FRIEND123",
    "signup_source": "website"
  }
}`}
              responseBody={`{
  "success": true,
  "attributes": {
    "referral_code": "FRIEND123",
    "signup_source": "website"
  }
}`}
            />
          </section>

          {/* Entitlements */}
          <section id="entitlements" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Entitlements
            </h2>
            <p className="text-muted-foreground mb-6">
              Define what features users get access to with their purchases.
            </p>

            <Endpoint
              method="GET"
              path="/entitlements"
              description="List all entitlements for the app"
              responseBody={`{
  "entitlements": [
    {
      "id": "ent_123",
      "identifier": "premium",
      "displayName": "Premium Access",
      "description": "Full access to all premium features"
    },
    {
      "id": "ent_456",
      "identifier": "pro",
      "displayName": "Pro Features",
      "description": "Advanced features for power users"
    }
  ]
}`}
            />

            <Endpoint
              method="POST"
              path="/entitlements/grant"
              description="Manually grant an entitlement to a subscriber"
              requestBody={`{
  "appUserId": "user_123",
  "entitlementId": "premium",
  "expiresAt": "2024-12-31T23:59:59Z"
}`}
              responseBody={`{
  "success": true,
  "entitlement": {
    "identifier": "premium",
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59Z",
    "grantedManually": true
  }
}`}
            />
          </section>

          {/* Offerings */}
          <section id="offerings" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Offerings
            </h2>
            <p className="text-muted-foreground mb-6">
              Configure which products to show users on your paywall.
            </p>

            <Endpoint
              method="GET"
              path="/offerings"
              description="Get current offerings for the app"
              responseBody={`{
  "current": {
    "id": "offering_default",
    "identifier": "default",
    "packages": [
      {
        "id": "pkg_monthly",
        "packageType": "MONTHLY",
        "product": {
          "id": "prod_123",
          "storeProductId": "com.app.premium_monthly",
          "price": 9.99,
          "priceString": "$9.99",
          "currencyCode": "USD",
          "title": "Premium Monthly",
          "description": "Full access, billed monthly"
        }
      },
      {
        "id": "pkg_annual",
        "packageType": "ANNUAL",
        "product": {
          "id": "prod_456",
          "storeProductId": "com.app.premium_annual",
          "price": 79.99,
          "priceString": "$79.99",
          "currencyCode": "USD",
          "title": "Premium Annual",
          "description": "Full access, billed yearly (save 33%)"
        }
      }
    ]
  },
  "all": {
    "default": { /* ... */ },
    "sale_offering": { /* ... */ }
  }
}`}
            />
          </section>

          {/* Products */}
          <section id="products" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Products
            </h2>
            <p className="text-muted-foreground mb-6">
              Manage products that map to App Store and Google Play products.
            </p>

            <Endpoint
              method="GET"
              path="/products"
              description="List all products for the app"
              responseBody={`{
  "products": [
    {
      "id": "prod_123",
      "identifier": "premium_monthly",
      "displayName": "Premium Monthly",
      "type": "subscription",
      "storeProductIdApple": "com.app.premium_monthly",
      "storeProductIdGoogle": "premium_monthly",
      "entitlements": ["premium"]
    }
  ]
}`}
            />

            <Endpoint
              method="POST"
              path="/products"
              description="Create a new product"
              requestBody={`{
  "identifier": "premium_annual",
  "displayName": "Premium Annual",
  "type": "subscription",
  "storeProductIdApple": "com.app.premium_annual",
  "storeProductIdGoogle": "premium_annual",
  "entitlementIds": ["premium"]
}`}
              responseBody={`{
  "product": {
    "id": "prod_789",
    "identifier": "premium_annual",
    "displayName": "Premium Annual",
    "type": "subscription",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}`}
            />
          </section>

          {/* Promo Codes */}
          <section id="promo-codes" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              Promo Codes
            </h2>
            <p className="text-muted-foreground mb-6">
              Create and manage promotional codes for discounts and free trials.
            </p>

            <Endpoint
              method="POST"
              path="/promo-codes"
              description="Create a new promo code"
              requestBody={`{
  "name": "SUMMER2024",
  "code": "SUMMER50",
  "type": "percentage_discount",
  "discountPercent": 50,
  "maxRedemptions": 1000,
  "expiresAt": "2024-09-01T00:00:00Z"
}`}
              responseBody={`{
  "promoCode": {
    "id": "promo_123",
    "code": "SUMMER50",
    "type": "percentage_discount",
    "discountPercent": 50,
    "redemptionCount": 0,
    "maxRedemptions": 1000,
    "isActive": true
  }
}`}
            />

            <Endpoint
              method="POST"
              path="/promo-codes/redeem"
              description="Redeem a promo code for a subscriber"
              requestBody={`{
  "code": "SUMMER50",
  "appUserId": "user_123"
}`}
              responseBody={`{
  "success": true,
  "redemption": {
    "id": "redemption_456",
    "promoCodeId": "promo_123",
    "discountApplied": 50,
    "type": "percentage_discount"
  }
}`}
            />
          </section>

          {/* Experiments */}
          <section id="experiments" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" />
              Experiments (A/B Testing)
            </h2>
            <p className="text-muted-foreground mb-6">
              Run A/B tests on offerings to optimize conversion rates.
            </p>

            <Endpoint
              method="GET"
              path="/experiments"
              description="List all experiments"
              responseBody={`{
  "experiments": [
    {
      "id": "exp_123",
      "name": "Paywall Pricing Test",
      "status": "running",
      "trafficAllocation": 50,
      "variants": [
        {
          "id": "var_a",
          "name": "Control",
          "offeringId": "default",
          "weight": 50
        },
        {
          "id": "var_b",
          "name": "New Pricing",
          "offeringId": "sale_offering",
          "weight": 50
        }
      ],
      "results": {
        "var_a": { "participants": 1000, "conversions": 50 },
        "var_b": { "participants": 1000, "conversions": 75 }
      }
    }
  ]
}`}
            />

            <Endpoint
              method="POST"
              path="/experiments/track"
              description="Track a conversion event for an experiment"
              requestBody={`{
  "experimentId": "exp_123",
  "appUserId": "user_123",
  "event": "purchase",
  "revenue": 9.99
}`}
              responseBody={`{
  "success": true,
  "recorded": true
}`}
            />
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Webhook className="w-6 h-6 text-primary" />
              Webhooks
            </h2>
            <p className="text-muted-foreground mb-6">
              Receive real-time notifications for subscription and purchase events.
            </p>

            <div className="mb-6 p-4 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-3">Webhook Events</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <code className="px-2 py-1 rounded bg-secondary">subscription.created</code>
                <code className="px-2 py-1 rounded bg-secondary">subscription.renewed</code>
                <code className="px-2 py-1 rounded bg-secondary">subscription.cancelled</code>
                <code className="px-2 py-1 rounded bg-secondary">subscription.expired</code>
                <code className="px-2 py-1 rounded bg-secondary">purchase.completed</code>
                <code className="px-2 py-1 rounded bg-secondary">purchase.refunded</code>
                <code className="px-2 py-1 rounded bg-secondary">entitlement.granted</code>
                <code className="px-2 py-1 rounded bg-secondary">entitlement.revoked</code>
              </div>
            </div>

            <CodeBlock
              title="Webhook Payload Example"
              language="json"
              code={`{
  "id": "evt_123456",
  "type": "subscription.renewed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "subscriber": {
      "appUserId": "user_123",
      "email": "user@example.com"
    },
    "subscription": {
      "productId": "com.app.premium_monthly",
      "platform": "ios",
      "expiresAt": "2024-02-15T00:00:00Z"
    },
    "revenue": {
      "amount": 9.99,
      "currency": "USD"
    }
  }
}`}
            />

            <div className="mt-6">
              <h3 className="font-semibold mb-3">Signature Verification</h3>
              <p className="text-muted-foreground mb-4">
                All webhook requests include a signature in the <code className="px-1.5 py-0.5 rounded bg-secondary text-sm">x-croissantpay-signature</code> header. Verify this signature to ensure the request is authentic.
              </p>
              <CodeBlock
                title="Node.js Verification"
                language="javascript"
                code={`import { verifyWebhookSignature } from '@croissantpay/react-native/server';

app.post('/webhooks/croissantpay', (req, res) => {
  const signature = req.headers['x-croissantpay-signature'];
  const isValid = verifyWebhookSignature(
    req.body,
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  const { type, data } = req.body;
  // ...
});`}
              />
            </div>
          </section>

          {/* Rate Limits */}
          <section id="rate-limits" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4">Rate Limits</h2>
            <p className="text-muted-foreground mb-4">
              API requests are rate limited based on your plan:
            </p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Plan</th>
                    <th className="px-4 py-3 text-left font-semibold">Requests/minute</th>
                    <th className="px-4 py-3 text-left font-semibold">Requests/month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3">Free</td>
                    <td className="px-4 py-3">60</td>
                    <td className="px-4 py-3">10,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Starter</td>
                    <td className="px-4 py-3">300</td>
                    <td className="px-4 py-3">100,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Growth</td>
                    <td className="px-4 py-3">600</td>
                    <td className="px-4 py-3">500,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Scale</td>
                    <td className="px-4 py-3">1,200</td>
                    <td className="px-4 py-3">2,000,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Self-hosted</td>
                    <td className="px-4 py-3">Unlimited</td>
                    <td className="px-4 py-3">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">CroissantPay</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 CroissantPay. MIT License.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a
        href={href}
        className="block px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        {children}
      </a>
    </li>
  );
}

function CodeBlock({
  title,
  language,
  code,
}: {
  title: string;
  language: string;
  code: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-secondary/50 border-b border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <span className="text-xs text-muted-foreground uppercase">{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Endpoint({
  method,
  path,
  description,
  requestBody,
  responseBody,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  requestBody?: string;
  responseBody: string;
}) {
  const methodColors = {
    GET: "bg-green-500/10 text-green-600 dark:text-green-400",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PUT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    PATCH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="mb-8 p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <p className="text-muted-foreground mb-4">{description}</p>

      {requestBody && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Request Body</h4>
          <pre className="p-3 rounded-lg bg-secondary/50 overflow-x-auto text-sm">
            <code>{requestBody}</code>
          </pre>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">Response</h4>
        <pre className="p-3 rounded-lg bg-secondary/50 overflow-x-auto text-sm">
          <code>{responseBody}</code>
        </pre>
      </div>
    </div>
  );
}

function ErrorCode({
  code,
  name,
  description,
}: {
  code: number;
  name: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border">
      <span className="px-2 py-1 rounded bg-secondary text-sm font-mono font-bold">
        {code}
      </span>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}



