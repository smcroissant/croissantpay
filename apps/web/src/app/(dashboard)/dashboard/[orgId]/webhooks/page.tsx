import { Bell, CheckCircle, XCircle, Clock, RefreshCw, Filter } from "lucide-react";
import { fetchWebhookEvents } from "@/app/actions/dashboard";

export default async function WebhooksPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const webhookEvents = await fetchWebhookEvents(50);

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

