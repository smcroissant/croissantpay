"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Apple,
  Play,
  Package,
  Tag,
  Repeat,
  Check,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type ProductType =
  | "consumable"
  | "non_consumable"
  | "auto_renewable_subscription"
  | "non_renewing_subscription";

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [formData, setFormData] = useState({
    appId: "",
    identifier: "",
    storeProductId: "",
    platform: "" as "ios" | "android" | "",
    type: "" as ProductType | "",
    displayName: "",
    description: "",
    subscriptionPeriod: "",
    trialDuration: "",
  });

  // Fetch apps
  const { data: apps, isLoading: loadingApps } = trpc.apps.list.useQuery();

  // Create product mutation
  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/products`);
      router.refresh();
    },
  });

  // Auto-select first app if only one
  if (apps?.length === 1 && !formData.appId) {
    setFormData((p) => ({ ...p, appId: apps[0].id }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.type) return;

    createProduct.mutate({
      appId: formData.appId,
      identifier: formData.identifier,
      storeProductId: formData.storeProductId,
      platform: formData.platform as "ios" | "android",
      type: formData.type as ProductType,
      displayName: formData.displayName,
      description: formData.description || undefined,
      subscriptionPeriod: formData.subscriptionPeriod || undefined,
      trialDuration: formData.trialDuration || undefined,
    });
  };

  const productTypes = [
    {
      value: "auto_renewable_subscription",
      label: "Auto-Renewable Subscription",
      description: "Automatically renews until canceled",
      icon: Repeat,
    },
    {
      value: "non_renewing_subscription",
      label: "Non-Renewing Subscription",
      description: "Time-limited access, manual renewal",
      icon: Repeat,
    },
    {
      value: "consumable",
      label: "Consumable",
      description: "Can be purchased multiple times (coins, gems)",
      icon: Package,
    },
    {
      value: "non_consumable",
      label: "Non-Consumable",
      description: "One-time permanent purchase",
      icon: Tag,
    },
  ];

  const subscriptionPeriods = [
    { value: "P7D", label: "Weekly (7 days)" },
    { value: "P1M", label: "Monthly" },
    { value: "P3M", label: "Quarterly (3 months)" },
    { value: "P6M", label: "Semi-Annual (6 months)" },
    { value: "P1Y", label: "Annual" },
  ];

  const trialDurations = [
    { value: "", label: "No trial" },
    { value: "P3D", label: "3 days" },
    { value: "P7D", label: "7 days" },
    { value: "P14D", label: "14 days" },
    { value: "P1M", label: "1 month" },
  ];

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/dashboard/${orgId}/products`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Apps Yet</h2>
          <p className="text-muted-foreground mb-6">
            You need to create an app before you can add products.
          </p>
          <Link
            href={`/dashboard/${orgId}/apps/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Your First App
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/${orgId}/products`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Add Product</h1>
        <p className="text-muted-foreground">
          Map an App Store or Play Store product to CroissantPay
        </p>
      </div>

      {/* Error */}
      {createProduct.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {createProduct.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Selection */}
        {apps.length > 1 && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Select App</h2>
            <select
              value={formData.appId}
              onChange={(e) => setFormData((p) => ({ ...p, appId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            >
              <option value="">Select an app</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Platform Selection */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Platform</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, platform: "ios" }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.platform === "ios"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Apple className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">iOS</p>
              <p className="text-xs text-muted-foreground">App Store</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, platform: "android" }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.platform === "android"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Play className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Android</p>
              <p className="text-xs text-muted-foreground">Google Play</p>
            </button>
          </div>
        </div>

        {/* Product Type */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Product Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {productTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFormData((p) => ({ ...p, type: type.value as ProductType }))
                }
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.type === type.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <type.icon className="w-5 h-5" />
                  {formData.type === type.value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Product Details</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Product Identifier
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) =>
                setFormData((p) => ({ ...p, identifier: e.target.value }))
              }
              placeholder="premium_monthly"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your internal identifier for this product
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Store Product ID
            </label>
            <input
              type="text"
              value={formData.storeProductId}
              onChange={(e) =>
                setFormData((p) => ({ ...p, storeProductId: e.target.value }))
              }
              placeholder={
                formData.platform === "ios"
                  ? "com.app.premium.monthly"
                  : "premium_monthly"
              }
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              The product ID in {formData.platform === "ios" ? "App Store Connect" : "Google Play Console"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, displayName: e.target.value }))
              }
              placeholder="Premium Monthly"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Unlock all premium features with monthly subscription"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Subscription Options */}
        {formData.type?.includes("subscription") && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold">Subscription Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Billing Period
              </label>
              <select
                value={formData.subscriptionPeriod}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, subscriptionPeriod: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                required
              >
                <option value="">Select billing period</option>
                {subscriptionPeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.type === "auto_renewable_subscription" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Free Trial Duration
                </label>
                <select
                  value={formData.trialDuration}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, trialDuration: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  {trialDurations.map((trial) => (
                    <option key={trial.value} value={trial.value}>
                      {trial.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/${orgId}/products`}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              createProduct.isPending ||
              !formData.appId ||
              !formData.platform ||
              !formData.type ||
              !formData.identifier ||
              !formData.storeProductId ||
              !formData.displayName
            }
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createProduct.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

