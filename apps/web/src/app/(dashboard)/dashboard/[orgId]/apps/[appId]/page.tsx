import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Webhook,
  Apple,
  Play,
  Settings,
  Activity,
  Users,
  Package,
} from "lucide-react";
import { fetchAppDetails } from "@/app/actions/dashboard";
import { CopyButton } from "@/components/copy-button";
import { RotateKeysButton, SendTestWebhookButton } from "@/components/app-actions";

export default async function AppDetailsPage({
  params,
}: {
  params: Promise<{ orgId: string; appId: string }>;
}) {
  const { orgId, appId } = await params;
  const app = await fetchAppDetails(appId);

  if (!app) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/${orgId}/apps`}
          className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-muted-foreground">
            {app.bundleId || app.packageName || "No bundle ID configured"}
          </p>
        </div>
        <Link
          href={`/dashboard/${orgId}/apps/${appId}/edit`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Edit
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Subscribers"
          value={app.subscriberCount.toString()}
          icon={Users}
          href={`/dashboard/${orgId}/subscribers?appId=${appId}`}
        />
        <StatCard
          label="Products"
          value={app.productCount.toString()}
          icon={Package}
          href={`/dashboard/${orgId}/products?appId=${appId}`}
        />
        <StatCard
          label="Webhooks (24h)"
          value={app.webhookStats.last24Hours.toString()}
          icon={Webhook}
          href={`/dashboard/${orgId}/webhooks?appId=${appId}`}
        />
        <StatCard
          label="Processed"
          value={`${app.webhookStats.processed}/${app.webhookStats.total}`}
          icon={Activity}
        />
      </div>

      {/* API Keys */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Use these keys to authenticate with CroissantPay
              </p>
            </div>
          </div>
          <RotateKeysButton appId={appId} />
        </div>

        <div className="space-y-4">
          <ApiKeyRow
            label="Public Key"
            description="Safe to use in client-side code (React Native SDK)"
            value={app.publicKey}
          />
          <ApiKeyRow
            label="Secret Key"
            description="Keep this secure! Use only in server-side code"
            value={maskKey(app.secretKey)}
            isSecret
          />
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your Webhook Endpoint</h2>
              <p className="text-sm text-muted-foreground">
                Receive real-time events at your server
              </p>
            </div>
          </div>
          {app.webhookUrl && <SendTestWebhookButton appId={appId} />}
        </div>

        {app.webhookUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary">
              <code className="flex-1 text-sm font-mono truncate">
                {app.webhookUrl}
              </code>
              <CopyButton text={app.webhookUrl} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Events like subscription.created, purchase.completed, etc. will be
                sent to this URL with HMAC-SHA256 signature verification.
              </p>
              <Link
                href={`/dashboard/${orgId}/apps/${appId}/edit?tab=webhook`}
                className="text-sm text-primary hover:underline shrink-0 ml-4"
              >
                Edit →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Webhook className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No webhook URL configured
            </p>
            <Link
              href={`/dashboard/${orgId}/apps/${appId}/edit?tab=webhook`}
              className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
            >
              Configure Webhook
            </Link>
          </div>
        )}
      </div>

      {/* Store Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Apple */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">App Store Connect</h3>
              <p className="text-sm text-muted-foreground">iOS configuration</p>
            </div>
          </div>

          {app.appleKeyId ? (
            <div className="space-y-3">
              <ConfigRow label="Key ID" value={app.appleKeyId} />
              <ConfigRow label="Issuer ID" value={maskString(app.appleIssuerId || "")} />
              <ConfigRow label="Team ID" value={app.appleTeamId || "-"} />
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Configured</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Not configured
              </p>
              <Link
                href={`/dashboard/${orgId}/apps/${appId}/edit?tab=apple`}
                className="text-sm text-primary hover:underline"
              >
                Configure App Store Connect →
              </Link>
            </div>
          )}
        </div>

        {/* Google */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-semibold">Google Play Console</h3>
              <p className="text-sm text-muted-foreground">
                Android configuration
              </p>
            </div>
          </div>

          {app.googleServiceAccount ? (
            <div className="space-y-3">
              <ConfigRow label="Service Account" value="Configured" />
              <ConfigRow label="Package Name" value={app.packageName || "-"} />
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-500">Configured</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Not configured
              </p>
              <Link
                href={`/dashboard/${orgId}/apps/${appId}/edit?tab=google`}
                className="text-sm text-primary hover:underline"
              >
                Configure Play Console →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Webhook Endpoints for Store Notifications */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Store Notification Endpoints</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure these URLs in App Store Connect and Google Play Console to
          receive server-to-server notifications.
        </p>
        <div className="space-y-3">
          <EndpointRow
            label="Apple App Store Server Notifications"
            url={`${process.env.BETTER_AUTH_URL || "https://your-domain.com"}/api/webhooks/apple`}
          />
          <EndpointRow
            label="Google Play Real-time Developer Notifications"
            url={`${process.env.BETTER_AUTH_URL || "https://your-domain.com"}/api/webhooks/google`}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <Icon className="w-8 h-8 text-muted-foreground/30" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {content}
    </div>
  );
}

function ApiKeyRow({
  label,
  description,
  value,
  copyValue,
  isSecret,
}: {
  label: string;
  description: string;
  value: string;
  copyValue?: string;
  isSecret?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <code
          className={`text-sm font-mono mt-2 block truncate ${
            isSecret ? "text-muted-foreground" : ""
          }`}
        >
          {value}
        </code>
      </div>
      <CopyButton text={copyValue || value} />
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <code className="font-mono">{value}</code>
    </div>
  );
}

function EndpointRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="p-3 rounded-xl bg-secondary">
      <p className="text-sm font-medium mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
          {url}
        </code>
        <CopyButton text={url} className="p-1.5" />
      </div>
    </div>
  );
}

function maskKey(key: string): string {
  const prefix = key.substring(0, key.indexOf("_") + 1);
  return `${prefix}${"•".repeat(20)}`;
}

function maskString(str: string): string {
  if (str.length <= 8) return str;
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

