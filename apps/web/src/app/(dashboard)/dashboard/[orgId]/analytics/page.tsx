import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Apple,
  Play,
} from "lucide-react";
import {
  fetchDashboardStats,
  fetchTopProducts,
  fetchRecentActivity,
  fetchRevenueChart,
  fetchSubscriberChart,
} from "@/app/actions/dashboard";
import { RevenueChart } from "./revenue-chart";
import { SubscriberChart } from "./subscriber-chart";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  const [stats, topProducts, recentActivity, revenueData, subscriberData] = await Promise.all([
    fetchDashboardStats(),
    fetchTopProducts(),
    fetchRecentActivity(10),
    fetchRevenueChart(30),
    fetchSubscriberChart(30),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your revenue, subscribers, and growth
        </p>
      </div>

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
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          change="All time"
          trend="neutral"
          icon={CreditCard}
        />
        <StatCard
          title="Churn Rate"
          value={`${stats?.churnRate || 0}%`}
          change="Monthly"
          trend={(stats?.churnRate || 0) > 5 ? "down" : "up"}
          icon={Activity}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
          <RevenueChart data={revenueData || []} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Subscriber Growth</h2>
          <SubscriberChart data={subscriberData || []} />
        </div>
      </div>

      {/* Top Products & Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {product.platform === "ios" ? (
                      <Apple className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Play className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.purchaseCount} purchases
                    </p>
                  </div>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No products yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {recentActivity && recentActivity.length > 0 ? (
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
                    <p className="text-xs text-muted-foreground">
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
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </div>
          )}
        </div>
      </div>
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

