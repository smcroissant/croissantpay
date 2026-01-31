// Deployment mode configuration
export type DeploymentMode = "self-hosted" | "cloud";

export interface PlanFeatures {
  maxApps: number;
  maxSubscribers: number;
  maxApiRequests: number; // per month
  webhookRetention: number; // days
  analyticsRetention: number; // days
  teamMembers: number;
  prioritySupport: boolean;
  customBranding: boolean;
  sla: string | null;
  dedicatedSupport: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number; // monthly in cents, 0 = free
  yearlyPrice: number; // yearly in cents (with discount)
  features: PlanFeatures;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    yearlyPrice: 0,
    features: {
      maxApps: 1,
      maxSubscribers: 100,
      maxApiRequests: 10_000,
      webhookRetention: 7,
      analyticsRetention: 30,
      teamMembers: 1,
      prioritySupport: false,
      customBranding: false,
      sla: null,
      dedicatedSupport: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small apps and indie developers",
    price: 2900, // $29/mo
    yearlyPrice: 29000, // $290/yr (2 months free)
    features: {
      maxApps: 3,
      maxSubscribers: 1_000,
      maxApiRequests: 100_000,
      webhookRetention: 30,
      analyticsRetention: 90,
      teamMembers: 3,
      prioritySupport: false,
      customBranding: false,
      sla: null,
      dedicatedSupport: false,
    },
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing apps with more subscribers",
    price: 9900, // $99/mo
    yearlyPrice: 99000, // $990/yr
    popular: true,
    features: {
      maxApps: 10,
      maxSubscribers: 10_000,
      maxApiRequests: 1_000_000,
      webhookRetention: 90,
      analyticsRetention: 365,
      teamMembers: 10,
      prioritySupport: true,
      customBranding: true,
      sla: "99.9%",
      dedicatedSupport: false,
    },
  },
  {
    id: "scale",
    name: "Scale",
    description: "For established apps with high volume",
    price: 29900, // $299/mo
    yearlyPrice: 299000, // $2990/yr
    features: {
      maxApps: -1, // unlimited
      maxSubscribers: 100_000,
      maxApiRequests: 10_000_000,
      webhookRetention: 365,
      analyticsRetention: 730,
      teamMembers: -1, // unlimited
      prioritySupport: true,
      customBranding: true,
      sla: "99.95%",
      dedicatedSupport: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: -1, // custom pricing
    yearlyPrice: -1,
    features: {
      maxApps: -1,
      maxSubscribers: -1,
      maxApiRequests: -1,
      webhookRetention: -1,
      analyticsRetention: -1,
      teamMembers: -1,
      prioritySupport: true,
      customBranding: true,
      sla: "99.99%",
      dedicatedSupport: true,
    },
  },
];

// Self-hosted has unlimited everything
export const SELF_HOSTED_PLAN: Plan = {
  id: "self-hosted",
  name: "Self-Hosted",
  description: "Run on your own infrastructure",
  price: 0,
  yearlyPrice: 0,
  features: {
    maxApps: -1,
    maxSubscribers: -1,
    maxApiRequests: -1,
    webhookRetention: -1,
    analyticsRetention: -1,
    teamMembers: -1,
    prioritySupport: false,
    customBranding: true,
    sla: null,
    dedicatedSupport: false,
  },
};

export function getDeploymentMode(): DeploymentMode {
  return (process.env.CROISSANTPAY_DEPLOYMENT_MODE as DeploymentMode) || "self-hosted";
}

export function isCloudMode(): boolean {
  return getDeploymentMode() === "cloud";
}

export function isSelfHosted(): boolean {
  return getDeploymentMode() === "self-hosted";
}

export function getPlanById(planId: string): Plan | undefined {
  if (planId === "self-hosted") return SELF_HOSTED_PLAN;
  return PLANS.find((p) => p.id === planId);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  if (cents === -1) return "Custom";
  return `$${(cents / 100).toFixed(0)}`;
}

export function formatLimit(value: number): string {
  if (value === -1) return "Unlimited";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

