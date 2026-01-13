import Link from "next/link";
import { Plus, Smartphone, Apple, Play, Key, Copy, Eye, Users, DollarSign } from "lucide-react";
import { fetchApps } from "@/app/actions/dashboard";
import { db } from "@/lib/db";
import { subscriber, subscription } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export default async function AppsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const apps = await fetchApps();

  // Get stats for each app
  const appsWithStats = await Promise.all(
    apps.map(async (app) => {
      // Get subscriber count
      const [subscriberCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscriber)
        .where(eq(subscriber.appId, app.id));

      // Get active subscription count for MRR estimate
      const [activeSubCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(subscription)
        .innerJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
        .where(
          and(
            eq(subscriber.appId, app.id),
            eq(subscription.status, "active")
          )
        );

      return {
        ...app,
        subscriberCount: Number(subscriberCount?.count || 0),
        activeSubscriptions: Number(activeSubCount?.count || 0),
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apps</h1>
          <p className="text-muted-foreground">
            Manage your mobile applications
          </p>
        </div>
        <Link
          href={`/dashboard/${orgId}/apps/new`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create App</span>
        </Link>
      </div>

      {appsWithStats.length === 0 ? (
        /* Empty State */
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No apps yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first app to start tracking in-app purchases and
            subscriptions.
          </p>
          <Link
            href={`/dashboard/${orgId}/apps/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First App</span>
          </Link>
        </div>
      ) : (
        /* App Cards Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appsWithStats.map((app) => (
            <AppCard key={app.id} app={app} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppCard({
  app,
  orgId,
}: {
  app: {
    id: string;
    name: string;
    bundleId: string | null;
    packageName: string | null;
    publicKey: string;
    subscriberCount: number;
    activeSubscriptions: number;
  };
  orgId: string;
}) {
  const initials = app.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasiOS = !!app.bundleId;
  const hasAndroid = !!app.packageName;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
          {initials}
        </div>
        <div className="flex gap-1">
          {hasiOS && (
            <div className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs flex items-center gap-1">
              <Apple className="w-3 h-3" />
              iOS
            </div>
          )}
          {hasAndroid && (
            <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs flex items-center gap-1">
              <Play className="w-3 h-3" />
              Android
            </div>
          )}
          {!hasiOS && !hasAndroid && (
            <div className="px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs">
              Not configured
            </div>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1">{app.name}</h3>
      <p className="text-muted-foreground text-sm mb-4 truncate">
        {app.bundleId || app.packageName || "No bundle ID set"}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold">{app.subscriberCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Subscribers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold">{app.activeSubscriptions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Active Subs</p>
          </div>
        </div>
      </div>

      {/* API Key Preview */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary mb-4">
        <Key className="w-4 h-4 text-muted-foreground shrink-0" />
        <code className="text-xs flex-1 truncate font-mono">
          {app.publicKey.substring(0, 20)}...
        </code>
        <button className="p-1 hover:bg-background rounded shrink-0">
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <Link
        href={`/dashboard/${orgId}/apps/${app.id}`}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span>View Details</span>
      </Link>
    </div>
  );
}

