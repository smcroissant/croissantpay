import React from "react";
import { Bell, CheckCircle, XCircle, Clock, RefreshCw, Filter, Apple, Settings, ExternalLink } from "lucide-react";
import { fetchWebhookEvents } from "@/app/actions/dashboard";
import { headers } from "next/headers";
import { CopyButton } from "./copy-button";

// Google Play icon component
function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
    </svg>
  );
}

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const webhookEvents = await fetchWebhookEvents(50);
  
  // Get the base URL for webhook endpoints
  const headersList = await headers();
  const host = headersList.get("host") || "your-domain.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Monitor and manage webhook events from Apple and Google
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apple Setup */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Apple App Store</h3>
              <p className="text-xs text-muted-foreground">Server-to-Server Notifications V2</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Webhook URL
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono break-all">
                  {baseUrl}/api/webhooks/apple
                </code>
                <CopyButton text={`${baseUrl}/api/webhooks/apple`} />
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Setup Instructions</h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
                  <span>Go to <a href="https://appstoreconnect.apple.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">App Store Connect <ExternalLink className="w-3 h-3" /></a></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
                  <span>Navigate to <strong>My Apps → Your App → App Information</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
                  <span>Scroll to <strong>App Store Server Notifications</strong> section</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">4</span>
                  <span>Enter the webhook URL above for both <strong>Production</strong> and <strong>Sandbox</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">5</span>
                  <span>Select <strong>Version 2 Notifications</strong></span>
                </li>
              </ol>
            </div>
            
            <div className="pt-3">
              <a 
                href="https://developer.apple.com/documentation/appstoreservernotifications" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View Apple Documentation <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Google Setup */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <GooglePlayIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Google Play</h3>
              <p className="text-xs text-muted-foreground">Real-time Developer Notifications</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Webhook URL
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono break-all">
                  {baseUrl}/api/webhooks/google
                </code>
                <CopyButton text={`${baseUrl}/api/webhooks/google`} />
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Setup Instructions</h4>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">1</span>
                  <span>Go to <a href="https://console.cloud.google.com/cloudpubsub" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">2</span>
                  <span>Create a <strong>Pub/Sub topic</strong> for your app</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">3</span>
                  <span>Create a <strong>push subscription</strong> with the webhook URL above</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">4</span>
                  <span>Go to <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Play Console <ExternalLink className="w-3 h-3" /></a></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">5</span>
                  <span>Navigate to <strong>Monetization setup → Real-time notifications</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 text-green-500 text-xs flex items-center justify-center font-medium">6</span>
                  <span>Enter your Pub/Sub topic name</span>
                </li>
              </ol>
            </div>
            
            <div className="pt-3">
              <a 
                href="https://developer.android.com/google/play/billing/getting-ready#configure-rtdn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View Google Documentation <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Why Webhooks Matter */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Why are webhooks important?</h3>
            <p className="text-sm text-muted-foreground">
              Webhooks are the <strong>source of truth</strong> for subscription status. Apple and Google send real-time notifications 
              when subscriptions are renewed, cancelled, refunded, or expire. This ensures your database is always in sync with 
              the actual subscription state, even when users manage subscriptions outside your app (e.g., through Settings on iOS 
              or Play Store on Android).
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={webhookEvents?.length.toString() || "0"}
          icon={Bell}
        />
        <StatCard
          label="Processed"
          value={
            webhookEvents
              ?.filter((e) => e.status === "processed")
              .length.toString() || "0"
          }
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Failed"
          value={
            webhookEvents
              ?.filter((e) => e.status === "failed")
              .length.toString() || "0"
          }
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Pending"
          value={
            webhookEvents
              ?.filter((e) => e.status === "pending")
              .length.toString() || "0"
          }
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Events Table */}
      {!webhookEvents || webhookEvents.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No webhook events yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Webhook events from Apple App Store and Google Play will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Event Type
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Source
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {webhookEvents.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium">{event.eventType}</span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {event.id.substring(0, 8)}...
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        event.source === "apple"
                          ? "bg-blue-500/10 text-blue-500"
                          : event.source === "google"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-purple-500/10 text-purple-500"
                      }`}
                    >
                      {event.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                        event.status === "processed"
                          ? "bg-green-500/10 text-green-500"
                          : event.status === "failed"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {event.status === "processed" && (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      {event.status === "failed" && (
                        <XCircle className="w-3 h-3" />
                      )}
                      {event.status === "pending" && (
                        <Clock className="w-3 h-3" />
                      )}
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {event.status === "failed" && (
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "red" | "yellow";
}) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            color ? colorClasses[color] : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
