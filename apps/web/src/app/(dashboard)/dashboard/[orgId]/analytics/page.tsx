"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Loader2,
  Smartphone,
  Apple,
  Calendar,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Google Play icon component
function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  );
}

type TimeRange = 7 | 30 | 90;

export default function AnalyticsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Fetch all analytics data
  const { data: stats, isLoading: loadingStats } = trpc.analytics.stats.useQuery();
  const { data: revenueChart, isLoading: loadingRevenue } = trpc.analytics.revenueChart.useQuery({
    days: timeRange,
  });
  const { data: subscriberChart, isLoading: loadingSubscribers } = trpc.analytics.subscriberChart.useQuery({
    days: timeRange,
  });
  const { data: topProducts, isLoading: loadingProducts } = trpc.analytics.topProducts.useQuery({
    limit: 5,
  });
  const { data: platformDist, isLoading: loadingPlatform } = trpc.analytics.platformDistribution.useQuery();
  const { data: recentActivity, isLoading: loadingActivity } = trpc.analytics.recentActivity.useQuery({
    limit: 10,
  });

  const isLoading =
    loadingStats ||
    loadingRevenue ||
    loadingSubscribers ||
    loadingProducts ||
    loadingPlatform ||
    loadingActivity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Prepare platform distribution data for pie chart
  const platformData = [
    { name: "iOS", value: platformDist?.ios || 0, color: "#3B82F6" },
    { name: "Android", value: platformDist?.android || 0, color: "#22C55E" },
  ];

  const totalPlatform = (platformDist?.ios || 0) + (platformDist?.android || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your revenue, subscribers, and product performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value) as TimeRange)}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.mrr || 0)}
          change={`${stats?.revenueGrowth && stats.revenueGrowth >= 0 ? "+" : ""}${stats?.revenueGrowth || 0}%`}
          trend={
            stats?.revenueGrowth && stats.revenueGrowth > 0
              ? "up"
              : stats?.revenueGrowth && stats.revenueGrowth < 0
              ? "down"
              : "neutral"
          }
          icon={DollarSign}
        />
        <StatCard
          title="Active Subscribers"
          value={formatNumber(stats?.activeSubscriptions || 0)}
          change={`${stats?.subscribersGrowth && stats.subscribersGrowth >= 0 ? "+" : ""}${stats?.subscribersGrowth || 0}%`}
          trend={
            stats?.subscribersGrowth && stats.subscribersGrowth > 0
              ? "up"
              : stats?.subscribersGrowth && stats.subscribersGrowth < 0
              ? "down"
              : "neutral"
          }
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Revenue</h2>
              <p className="text-sm text-muted-foreground">
                Daily revenue over the last {timeRange} days
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(
                  revenueChart?.reduce((sum, d) => sum + d.revenue, 0) || 0
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="h-64">
            {revenueChart && revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No revenue data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscriber Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Subscribers</h2>
              <p className="text-sm text-muted-foreground">
                New subscribers over the last {timeRange} days
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-500">
                {subscriberChart?.reduce((sum, d) => sum + d.new, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">New</p>
            </div>
          </div>
          <div className="h-64">
            {subscriberChart && subscriberChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={subscriberChart}>
                  <defs>
                    <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "new" ? "New Subscribers" : "Total",
                    ]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#subscriberGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No subscriber data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Top Products</h2>
            <p className="text-sm text-muted-foreground">By revenue</p>
          </div>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {product.platform === "ios" ? (
                        <Apple className="w-3 h-3" />
                      ) : (
                        <GooglePlayIcon className="w-3 h-3" />
                      )}
                      <span>{product.platform === "ios" ? "iOS" : "Android"}</span>
                      <span>•</span>
                      <span>{product.subscribers} subscribers</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mb-2 opacity-50" />
              <p>No products yet</p>
              <p className="text-sm">Products will appear here when you add them</p>
            </div>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">Platform Distribution</h2>
          {totalPlatform > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <p>No data yet</p>
            </div>
          )}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">
                iOS ({platformDist?.ios || 0})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">
                Android ({platformDist?.android || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
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
