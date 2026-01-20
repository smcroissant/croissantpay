"use client";

import {
  Apple,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { GooglePlayIcon } from "@/components/app-setup";

export function WebhooksStep({ 
  appId,
  copyToClipboard,
  copiedCode,
}: { 
  appId: string | null;
  copyToClipboard: (text: string, id: string) => void;
  copiedCode: string | null;
}) {
  const { data: app } = trpc.apps.get.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  if (!appId || !app) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Please create an app first in step 1.</p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const appleWebhookUrl = `${baseUrl}/api/webhooks/apple/${app.appleWebhookId}`;
  const googleWebhookUrl = `${baseUrl}/api/webhooks/google/${app.googleWebhookId}`;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Webhooks are <strong>essential</strong> for keeping your subscription data in sync. Copy these URLs and configure them in App Store Connect and Google Play Console.
      </p>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-sm text-yellow-400">
          <strong>⚠️ Important:</strong> Without webhooks, subscription changes made outside your app won&apos;t be reflected in your system.
        </p>
      </div>

      {/* Apple Webhook */}
      <div className="bg-secondary/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Apple className="w-6 h-6" />
          <h4 className="font-medium">Apple App Store Webhook URL</h4>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={appleWebhookUrl}
            readOnly
            className="flex-1 px-4 py-2 rounded-xl bg-background border border-border font-mono text-sm"
          />
          <button
            onClick={() => copyToClipboard(appleWebhookUrl, "apple")}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copiedCode === "apple" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <ol className="text-sm space-y-1 text-muted-foreground">
          <li>1. Go to App Store Connect → Your App → App Information</li>
          <li>2. Find &quot;App Store Server Notifications&quot;</li>
          <li>3. Paste the URL above and select &quot;Version 2&quot;</li>
        </ol>
      </div>

      {/* Google Webhook */}
      <div className="bg-secondary/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <GooglePlayIcon className="w-6 h-6" />
          <h4 className="font-medium">Google Play Webhook URL</h4>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={googleWebhookUrl}
            readOnly
            className="flex-1 px-4 py-2 rounded-xl bg-background border border-border font-mono text-sm"
          />
          <button
            onClick={() => copyToClipboard(googleWebhookUrl, "google")}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {copiedCode === "google" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <ol className="text-sm space-y-1 text-muted-foreground">
          <li>1. Create a Pub/Sub topic in Google Cloud Console</li>
          <li>2. Create a push subscription with the URL above</li>
          <li>3. Go to Play Console → Monetization → Enter topic name</li>
        </ol>
      </div>
    </div>
  );
}
