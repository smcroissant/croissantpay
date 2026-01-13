"use client";

import { useState } from "react";
import { CreditCard, Check, Loader2, ExternalLink, Crown, Zap, Building2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function BillingSettings({ orgId }: { orgId: string }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: billing, isLoading } = trpc.organizations.getBilling.useQuery();
  const { data: usageData } = trpc.organizations.getUsage.useQuery();

  const createCheckout = trpc.organizations.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const createPortal = trpc.organizations.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!billing?.isCloudMode) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Billing</h2>
            <p className="text-sm text-muted-foreground">
              Self-hosted mode - no billing required
            </p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400">
            You&apos;re running CroissantPay in self-hosted mode with unlimited features. 
            No subscription required!
          </p>
        </div>
      </div>
    );
  }

  const currentPlan = billing.plan;
  const subscription = billing.subscription;
  const plans = billing.plans || [];

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    if (cents === -1) return "Custom";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const formatLimit = (value: number) => {
    if (value === -1) return "Unlimited";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  const handleUpgrade = (planId: string) => {
    if (planId === "enterprise") {
      window.open("mailto:sales@croissantpay.dev?subject=Enterprise%20Plan%20Inquiry", "_blank");
      return;
    }
    createCheckout.mutate({ planId, billingCycle });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "free":
        return <Zap className="w-5 h-5" />;
      case "starter":
        return <Zap className="w-5 h-5" />;
      case "growth":
        return <Crown className="w-5 h-5" />;
      case "scale":
        return <Crown className="w-5 h-5" />;
      case "enterprise":
        return <Building2 className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Billing & Subscription</h2>
            <p className="text-sm text-muted-foreground">
              Manage your organization&apos;s subscription
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold">{currentPlan?.name || "Free"}</p>
            </div>
            {subscription && subscription.status === "active" && (
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                Active
              </span>
            )}
          </div>

          {currentPlan && currentPlan.id !== "free" && subscription && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Billing: {subscription.billingCycle === "yearly" ? "Yearly" : "Monthly"}
              </p>
              {subscription.currentPeriodEnd && (
                <p>
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>
          )}

          {subscription && subscription.status === "active" && currentPlan?.id !== "free" && (
            <button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm"
            >
              {createPortal.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {/* Usage Warnings */}
        {usageData?.warnings && usageData.warnings.length > 0 && (
          <div className="space-y-2 mb-6">
            {usageData.warnings.map((warning, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  warning.severity === "critical"
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-yellow-500/10 border border-yellow-500/20"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    warning.severity === "critical" ? "text-red-500" : "text-yellow-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    warning.severity === "critical" ? "text-red-500" : "text-yellow-500"
                  }`}
                >
                  {warning.metric === "apps" && `You're at ${warning.percentage}% of your app limit.`}
                  {warning.metric === "subscribers" && `You're at ${warning.percentage}% of your subscriber limit.`}
                  {warning.metric === "apiRequests" && `You're at ${warning.percentage}% of your monthly API request limit.`}
                  {warning.metric === "teamMembers" && `You're at ${warning.percentage}% of your team member limit.`}
                  {warning.severity === "critical" && " Upgrade your plan to continue."}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Plan Limits with Usage */}
        {currentPlan && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <UsageCard
              label="Apps"
              current={usageData?.usage.apps || 0}
              limit={currentPlan.features.maxApps}
              percentage={usageData?.percentages.apps || 0}
            />
            <UsageCard
              label="Subscribers"
              current={usageData?.usage.subscribers || 0}
              limit={currentPlan.features.maxSubscribers}
              percentage={usageData?.percentages.subscribers || 0}
            />
            <UsageCard
              label="API Requests"
              current={usageData?.usage.apiRequests || 0}
              limit={currentPlan.features.maxApiRequests}
              percentage={usageData?.percentages.apiRequests || 0}
              suffix="/mo"
            />
            <UsageCard
              label="Team Members"
              current={usageData?.usage.teamMembers || 0}
              limit={currentPlan.features.teamMembers}
              percentage={usageData?.percentages.teamMembers || 0}
            />
          </div>
        )}
      </div>

      {/* Upgrade Plans */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Available Plans</h3>
          
          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1 text-xs opacity-75">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.filter(p => p.id !== "free" && p.id !== "enterprise").map((plan) => {
            const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.price;
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isDowngrade = currentPlan && plans.findIndex(p => p.id === currentPlan.id) > plans.findIndex(p => p.id === plan.id);

            return (
              <div
                key={plan.id}
                className={`relative p-5 rounded-xl border transition-all ${
                  isCurrentPlan
                    ? "border-primary bg-primary/5"
                    : selectedPlan === plan.id
                    ? "border-primary/50 bg-secondary/50"
                    : "border-border hover:border-primary/30"
                } ${plan.popular ? "ring-2 ring-primary/20" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plan.id === "growth" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h4 className="font-semibold">{plan.name}</h4>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{formatPrice(price)}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxApps)} apps
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxSubscribers)} subscribers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {formatLimit(plan.features.maxApiRequests)} API requests/mo
                  </li>
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Priority support
                    </li>
                  )}
                  {plan.features.sla && (
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {plan.features.sla} SLA
                    </li>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-sm font-medium"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={createCheckout.isPending}
                    className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDowngrade
                        ? "bg-secondary hover:bg-secondary/80"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    } disabled:opacity-50`}
                  >
                    {createCheckout.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : isDowngrade ? (
                      "Downgrade"
                    ) : (
                      "Upgrade"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise */}
        <div className="mt-4 p-5 rounded-xl border border-border bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold">Enterprise</h4>
                <p className="text-sm text-muted-foreground">
                  Custom solutions for large organizations
                </p>
              </div>
            </div>
            <button
              onClick={() => handleUpgrade("enterprise")}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm font-medium"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for usage display
function UsageCard({
  label,
  current,
  limit,
  percentage,
  suffix = "",
}: {
  label: string;
  current: number;
  limit: number;
  percentage: number;
  suffix?: string;
}) {
  const formatValue = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  };

  const formatLimit = (value: number) => {
    if (value === -1) return "Unlimited";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  const getColorClass = () => {
    if (limit === -1) return "bg-green-500";
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {limit !== -1 && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              percentage >= 100
                ? "bg-red-500/10 text-red-500"
                : percentage >= 80
                ? "bg-yellow-500/10 text-yellow-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
      <p className="font-semibold">
        {formatValue(current)}
        <span className="text-muted-foreground font-normal">
          {" / "}
          {formatLimit(limit)}
          {suffix}
        </span>
      </p>
      {limit !== -1 && (
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getColorClass()}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
    </div>
  );
}

