import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  ArrowRight,
  Smartphone,
  Package,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchApps,
  fetchUsageData,
} from "@/app/actions/dashboard";
import { isCloudMode } from "@/lib/config";

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  const [stats, recentActivity, apps, usageData] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(5),
    fetchApps(),
    fetchUsageData(),
  ]);

  const hasApps = apps && apps.length > 0;

  return (
    <div className="space-y-6">
      {/* Usage Warnings */}
      {usageData?.warnings && usageData.warnings.length > 0 && (
        <div className="space-y-2">
          {usageData.warnings.map((warning, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                warning.severity === "critical"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              }`}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="flex-1 text-sm">{warning.message}</p>
              <Link
                href="/pricing"
                className="text-sm font-medium hover:underline"
              >
                Upgrade
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.mrr || 0)}
          change={`${stats?.revenueGrowth && stats.revenueGrowth >= 0 ? "+" : ""}${stats?.revenueGrowth || 0}%`}
          trend={stats?.revenueGrowth && stats.revenueGrowth > 0 ? "up" : stats?.revenueGrowth && stats.revenueGrowth < 0 ? "down" : "neutral"}
          icon={DollarSign}
        />
        <StatCard
          title="Active Subscribers"
          value={formatNumber(stats?.activeSubscriptions || 0)}
          change={`${stats?.subscribersGrowth && stats.subscribersGrowth >= 0 ? "+" : ""}${stats?.subscribersGrowth || 0}%`}
          trend={stats?.subscribersGrowth && stats.subscribersGrowth > 0 ? "up" : stats?.subscribersGrowth && stats.subscribersGrowth < 0 ? "down" : "neutral"}
          icon={Users}
        />
        <StatCard
          title="Total Subscribers"
          value={formatNumber(stats?.totalSubscribers || 0)}
          change="All time"
          trend="neutral"
          icon={CreditCard}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change="All time"
          trend="neutral"
          icon={Activity}
        />
      </div>

      {/* Quick Actions / Getting Started */}
      {!hasApps && (
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to CroissantPay!</h2>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first app and connecting it to the App Store or Play Store.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/dashboard/${orgId}/apps/new`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                Create Your First App
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Read the Docs
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {hasApps && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link
                href={`/dashboard/${orgId}/analytics`}
                className="text-sm text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === "purchase"
                          ? "bg-green-500/20 text-green-400"
                          : activity.type === "refund"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {activity.amount && (
                      <span
                        className={`font-semibold ${
                          activity.type === "refund" ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {activity.type === "refund" ? "-" : "+"}
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No activity yet</p>
                <p className="text-sm">Transactions will appear here as they happen</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            {/* Apps Overview */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Your Apps</h2>
                <Link
                  href={`/dashboard/${orgId}/apps`}
                  className="text-sm text-primary hover:underline"
                >
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {apps.slice(0, 3).map((app) => (
                  <Link
                    key={app.id}
                    href={`/dashboard/${orgId}/apps/${app.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.bundleId || app.packageName || "No bundle ID"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              {apps.length === 0 && (
                <Link
                  href={`/dashboard/${orgId}/apps/new`}
                  className="block text-center p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                >
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add your first app</p>
                </Link>
              )}
            </div>

            {/* Usage Stats (Cloud only) */}
            {isCloudMode() && usageData && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Usage</h2>
                  <Link
                    href={`/dashboard/${orgId}/settings`}
                    className="text-sm text-primary hover:underline"
                  >
                    Upgrade
                  </Link>
                </div>
                <div className="space-y-4">
                  <UsageBar
                    label="Subscribers"
                    current={usageData.usage.subscribers}
                    limit={100}
                  />
                  <UsageBar
                    label="API Requests"
                    current={usageData.usage.apiRequests}
                    limit={10000}
                  />
                  <UsageBar
                    label="Apps"
                    current={usageData.usage.apps}
                    limit={1}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-muted-foreground text-sm">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <div className="flex items-center gap-1">
        {trend === "up" && (
          <>
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">{change}</span>
          </>
        )}
        {trend === "down" && (
          <>
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500">{change}</span>
          </>
        )}
        {trend === "neutral" && (
          <span className="text-sm text-muted-foreground">{change}</span>
        )}
        {trend !== "neutral" && (
          <span className="text-sm text-muted-foreground">vs last month</span>
        )}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">
          {formatNumber(current)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical
              ? "bg-red-500"
              : isWarning
              ? "bg-yellow-500"
              : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

