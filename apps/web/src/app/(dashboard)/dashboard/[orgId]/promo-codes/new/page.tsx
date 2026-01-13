"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function NewPromoCodePage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "percentage_discount" as "percentage_discount" | "fixed_discount" | "free_trial_extension" | "free_subscription",
    discountPercent: "",
    discountAmount: "",
    freeTrialDays: "",
    maxRedemptions: "",
    expiresAt: "",
    appId: "",
  });

  // Fetch apps
  const { data: apps, isLoading: loadingApps } = trpc.apps.list.useQuery();

  // Create promo code mutation
  const createPromoCode = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/promo-codes`);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.appId || !formData.name) return;

    createPromoCode.mutate({
      appId: formData.appId,
      name: formData.name,
      code: formData.code || undefined,
      type: formData.type,
      discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : undefined,
      discountAmount: formData.discountAmount ? parseFloat(formData.discountAmount) : undefined,
      freeTrialDays: formData.freeTrialDays ? parseInt(formData.freeTrialDays) : undefined,
      maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
    });
  };

  if (loadingApps) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/${orgId}/promo-codes`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Promo Codes</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create Promo Code</h1>
        <p className="text-muted-foreground">
          Create a promotional code for your users
        </p>
      </div>

      {/* Error */}
      {createPromoCode.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {createPromoCode.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">App *</label>
            <select
              value={formData.appId}
              onChange={(e) => setFormData((p) => ({ ...p, appId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            >
              <option value="">Select an app</option>
              {apps?.map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Summer Sale 2024"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Promo Code (optional)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER2024 (auto-generated if empty)"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as typeof formData.type }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            >
              <option value="percentage_discount">Percentage Discount</option>
              <option value="fixed_discount">Fixed Amount Discount</option>
              <option value="free_trial_extension">Free Trial Extension</option>
              <option value="free_subscription">Free Subscription</option>
            </select>
          </div>

          {formData.type === "percentage_discount" && (
            <div>
              <label className="block text-sm font-medium mb-2">Discount (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.discountPercent}
                onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
                placeholder="20"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          )}

          {formData.type === "fixed_discount" && (
            <div>
              <label className="block text-sm font-medium mb-2">Discount Amount ($)</label>
              <input
                type="number"
                min={1}
                value={formData.discountAmount}
                onChange={(e) => setFormData((p) => ({ ...p, discountAmount: e.target.value }))}
                placeholder="5.00"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          )}

          {formData.type === "free_trial_extension" && (
            <div>
              <label className="block text-sm font-medium mb-2">Free Trial Days</label>
              <input
                type="number"
                min={1}
                value={formData.freeTrialDays}
                onChange={(e) => setFormData((p) => ({ ...p, freeTrialDays: e.target.value }))}
                placeholder="7"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Max Redemptions (optional)</label>
            <input
              type="number"
              value={formData.maxRedemptions}
              onChange={(e) => setFormData((p) => ({ ...p, maxRedemptions: e.target.value }))}
              placeholder="Unlimited if empty"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date (optional)</label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/${orgId}/promo-codes`}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createPromoCode.isPending || !formData.appId || !formData.name}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createPromoCode.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Create Promo Code"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

