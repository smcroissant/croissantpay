import Link from "next/link";
import { Users, Search, Filter, Download, Apple, Play } from "lucide-react";
import { db } from "@/lib/db";
import { subscriber, subscription, app } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export default async function SubscribersPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ appId?: string }>;
}) {
  const { orgId } = await params;
  const { appId } = await searchParams;

  // Build query
  const query = db
    .select({
      subscriber,
      subscription,
      app,
    })
    .from(subscriber)
    .leftJoin(subscription, eq(subscription.subscriberId, subscriber.id))
    .leftJoin(app, eq(subscriber.appId, app.id))
    .orderBy(desc(subscriber.createdAt))
    .limit(50);

  const results = await query;

  // Group by subscriber
  const subscribersMap = new Map<string, {
    subscriber: typeof subscriber.$inferSelect;
    subscriptions: Array<typeof subscription.$inferSelect>;
    app: typeof app.$inferSelect | null;
  }>();

  for (const row of results) {
    if (!subscribersMap.has(row.subscriber.id)) {
      subscribersMap.set(row.subscriber.id, {
        subscriber: row.subscriber,
        subscriptions: [],
        app: row.app,
      });
    }
    if (row.subscription) {
      subscribersMap.get(row.subscriber.id)!.subscriptions.push(row.subscription);
    }
  }

  const subscribers = Array.from(subscribersMap.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground">
            Manage your app subscribers and their subscriptions
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by subscriber ID or email..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border hover:bg-secondary transition-colors">
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Subscribers Table */}
      {subscribers.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No subscribers yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribers will appear here when users make purchases in your apps.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Subscriber
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  App
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Platform
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(({ subscriber: sub, subscriptions, app }) => {
                const activeSubscription = subscriptions.find(
                  (s) => s.status === "active"
                );
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/${orgId}/subscribers/${sub.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {sub.originalAppUserId}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">
                        {sub.id.substring(0, 8)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {app ? (
                        <span className="text-sm">{app.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {activeSubscription ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
                          Active
                        </span>
                      ) : subscriptions.length > 0 ? (
                        <span className="inline-flex px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full bg-gray-500/10 text-gray-500 text-xs">
                          No Subscription
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.platform === "ios" ? (
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Apple className="w-4 h-4" />
                          <span className="text-sm">iOS</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-400">
                          <Play className="w-4 h-4" />
                          <span className="text-sm">Android</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

