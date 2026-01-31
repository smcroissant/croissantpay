import Link from "next/link";
import { ArrowLeft, Webhook, Check, AlertTriangle, Code } from "lucide-react";

export default function WebhooksDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/docs"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              Receive real-time events
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Intro */}
          <p className="lead text-xl text-muted-foreground">
            CroissantPay sends webhooks to your server when subscription events
            occur. Use webhooks to update your database, send emails, or trigger
            other actions in real-time.
          </p>

          {/* Setup */}
          <h2 className="flex items-center gap-2 mt-12">
            <Webhook className="w-6 h-6 text-primary" />
            Setting Up Webhooks
          </h2>

          <ol className="space-y-4">
            <li>
              <strong>Configure your endpoint</strong> - Go to your app settings
              in the CroissantPay dashboard and enter your webhook URL.
            </li>
            <li>
              <strong>Save your secret</strong> - CroissantPay will generate a
              webhook secret. Store this securely - you&apos;ll need it to
              verify signatures.
            </li>
            <li>
              <strong>Handle events</strong> - Implement an endpoint that
              receives POST requests and processes events.
            </li>
          </ol>

          {/* Event Types */}
          <h2>Event Types</h2>

          <p>
            CroissantPay uses RevenueCat-compatible event types, making migration easy.
            Events are triggered when Apple App Store or Google Play send notifications.
          </p>

          <div className="not-prose">
            <div className="grid gap-4">
              <EventCategory
                title="Initial Purchase Events"
                events={[
                  {
                    name: "INITIAL_PURCHASE",
                    description:
                      "New subscription was purchased for the first time",
                  },
                  {
                    name: "NON_RENEWING_PURCHASE",
                    description: "A non-renewing or one-time purchase was made",
                  },
                ]}
              />

              <EventCategory
                title="Renewal Events"
                events={[
                  {
                    name: "RENEWAL",
                    description: "Subscription was automatically renewed",
                  },
                  {
                    name: "PRODUCT_CHANGE",
                    description: "User upgraded or downgraded their subscription",
                  },
                ]}
              />

              <EventCategory
                title="Cancellation Events"
                events={[
                  {
                    name: "CANCELLATION",
                    description: "User turned off auto-renewal (will expire at period end)",
                  },
                  {
                    name: "UNCANCELLATION",
                    description: "User re-enabled auto-renewal before expiration",
                  },
                ]}
              />

              <EventCategory
                title="Billing Events"
                events={[
                  {
                    name: "BILLING_ISSUE",
                    description: "Payment failed, subscription entering grace period or retry",
                  },
                  {
                    name: "BILLING_ISSUE_RESOLVED",
                    description: "Payment issue was resolved, subscription is active again",
                  },
                ]}
              />

              <EventCategory
                title="Expiration & Refund Events"
                events={[
                  {
                    name: "EXPIRATION",
                    description: "Subscription has expired and is no longer active",
                  },
                  {
                    name: "REFUND",
                    description: "Purchase was refunded or revoked by the store",
                  },
                ]}
              />

              <EventCategory
                title="Trial Events"
                events={[
                  { name: "TRIAL_STARTED", description: "Free trial period started" },
                  {
                    name: "TRIAL_CONVERTED",
                    description: "Trial converted to paid subscription",
                  },
                  {
                    name: "TRIAL_CANCELLED",
                    description: "User cancelled during trial (before conversion)",
                  },
                ]}
              />

              <EventCategory
                title="Grace Period Events"
                events={[
                  {
                    name: "GRACE_PERIOD_ENTERED",
                    description: "Subscription entered grace period due to billing issue",
                  },
                  {
                    name: "GRACE_PERIOD_EXITED",
                    description: "Grace period ended (either resolved or expired)",
                  },
                ]}
              />

              <EventCategory
                title="Pause Events (Android only)"
                events={[
                  {
                    name: "SUBSCRIPTION_PAUSED",
                    description: "User paused their subscription (Google Play only)",
                  },
                  {
                    name: "SUBSCRIPTION_RESUMED",
                    description: "User resumed their paused subscription",
                  },
                ]}
              />

              <EventCategory
                title="Test Events"
                events={[
                  {
                    name: "TEST",
                    description: "Test webhook sent from the dashboard",
                  },
                ]}
              />
            </div>
          </div>

          {/* Payload Format */}
          <h2 className="flex items-center gap-2 mt-12">
            <Code className="w-6 h-6 text-primary" />
            Webhook Payload
          </h2>

          <p>
            Every webhook event includes comprehensive subscriber, subscription, and entitlement data.
            This format is designed to be compatible with RevenueCat webhooks:
          </p>

          <pre className="bg-secondary rounded-xl p-4 overflow-x-auto text-xs">
            <code>{`{
  "api_version": "1.0",
  "event": {
    "id": "evt_abc123...",
    "type": "RENEWAL",
    "app_id": "app_xyz789...",
    "event_timestamp_ms": 1705315800000,
    
    // Complete subscriber information
    "subscriber_info": {
      "id": "sub_123...",
      "app_user_id": "user_456",
      "original_app_user_id": null,
      "aliases": [],
      "first_seen_at": "2024-01-01T00:00:00Z",
      "last_seen_at": "2024-01-15T10:30:00Z",
      "attributes": {}
    },
    
    // Product details
    "product": {
      "id": "prod_abc...",
      "identifier": "pro_monthly",
      "store_product_id": "com.yourapp.pro.monthly",
      "platform": "ios",
      "type": "auto_renewable_subscription",
      "display_name": "Pro Monthly",
      "subscription_period": "P1M",
      "trial_period": "P7D"
    },
    
    // Subscription state
    "subscription": {
      "id": "subscription_123...",
      "status": "active",
      "original_transaction_id": "1000000123456789",
      "latest_transaction_id": "1000000987654321",
      "purchase_date": "2024-01-15T10:30:00Z",
      "original_purchase_date": "2023-12-15T10:30:00Z",
      "expires_date": "2024-02-15T10:30:00Z",
      "auto_renew_enabled": true,
      "is_trial_period": false,
      "is_intro_period": false,
      "canceled_at": null,
      "cancellation_reason": null,
      "grace_period_expires_date": null
    },
    
    // Current entitlements snapshot
    "entitlements": [
      {
        "id": "ent_abc...",
        "identifier": "premium",
        "is_active": true,
        "expires_date": "2024-02-15T10:30:00Z",
        "product_identifier": "pro_monthly"
      }
    ],
    
    "platform": "ios",
    "environment": "production",
    
    // Original store notification info
    "store_event": {
      "type": "DID_RENEW",
      "event_id": "apple_notification_uuid"
    }
  }
}`}</code>
          </pre>

          {/* Signature Verification */}
          <h2 className="flex items-center gap-2 mt-12">
            <Check className="w-6 h-6 text-green-500" />
            Verifying Signatures
          </h2>

          <p>
            Always verify webhook signatures to ensure events are from CroissantPay.
            We include a signature in the <code>X-CroissantPay-Signature</code>{" "}
            header.
          </p>

          <h3>Using the SDK (Node.js)</h3>

          <pre className="bg-secondary rounded-xl p-4 overflow-x-auto">
            <code>{`import { verifyWebhookSignature, constructEvent } from '@croissantpay/react-native';

app.post('/webhooks/croissantpay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-croissantpay-signature'];
  const payload = req.body.toString();

  try {
    const event = constructEvent(
      payload,
      signature,
      process.env.CROISSANTPAY_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'subscription.renewed':
        await handleRenewal(event.data);
        break;
      case 'subscription.expired':
        await handleExpiration(event.data);
        break;
      // ... handle other events
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook Error');
  }
});`}</code>
          </pre>

          <h3>Manual Verification</h3>

          <pre className="bg-secondary rounded-xl p-4 overflow-x-auto">
            <code>{`import crypto from 'crypto';

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expectedSignature)
  );
}`}</code>
          </pre>

          {/* Best Practices */}
          <h2 className="flex items-center gap-2 mt-12">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Best Practices
          </h2>

          <div className="not-prose">
            <div className="space-y-4">
              <BestPractice
                title="Return 200 quickly"
                description="Return a 200 response as soon as possible. Process the webhook asynchronously if needed."
              />
              <BestPractice
                title="Handle duplicates"
                description="Use the event ID to detect and handle duplicate deliveries. Store processed event IDs."
              />
              <BestPractice
                title="Implement idempotency"
                description="Make sure processing the same event twice doesn't cause issues."
              />
              <BestPractice
                title="Use HTTPS"
                description="Always use HTTPS endpoints in production."
              />
              <BestPractice
                title="Monitor failures"
                description="Set up alerting for webhook failures. CroissantPay retries failed webhooks up to 3 times."
              />
            </div>
          </div>

          {/* Retry Policy */}
          <h2>Retry Policy</h2>

          <p>If your endpoint doesn&apos;t return a 2xx response, we&apos;ll retry:</p>

          <ul>
            <li>
              <strong>1st retry:</strong> After 2 seconds
            </li>
            <li>
              <strong>2nd retry:</strong> After 4 seconds
            </li>
            <li>
              <strong>3rd retry:</strong> After 8 seconds
            </li>
          </ul>

          <p>
            After 3 failed attempts, the webhook will be marked as failed. You
            can view failed webhooks in the dashboard.
          </p>

          {/* Testing */}
          <h2>Testing Webhooks</h2>

          <p>
            Use the &quot;Send Test&quot; button in your app settings to send a
            test webhook to your endpoint. This helps verify your integration
            before going live.
          </p>

          <p>
            For local development, you can use tools like{" "}
            <a
              href="https://ngrok.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              ngrok
            </a>{" "}
            to expose your local server to the internet.
          </p>
        </div>
      </main>
    </div>
  );
}

function EventCategory({
  title,
  events,
}: {
  title: string;
  events: { name: string; description: string }[];
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-secondary px-4 py-2 font-semibold">{title}</div>
      <div className="divide-y divide-border">
        {events.map((event) => (
          <div key={event.name} className="px-4 py-3 flex items-start gap-4">
            <code className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded font-medium whitespace-nowrap">
              {event.name}
            </code>
            <span className="text-sm text-muted-foreground">
              {event.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BestPractice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary">
      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

