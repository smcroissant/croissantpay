"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function EditPromoCodePage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const promoCodeId = params.promoCodeId as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    maxRedemptions: "",
    maxRedemptionsPerUser: "",
    expiresAt: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch promo code
  const {
    data: promoCode,
    isLoading,
    error,
  } = trpc.promoCodes.get.useQuery({ promoCodeId });

  // Update form when data loads
  useEffect(() => {
    if (promoCode) {
      setFormData({
        name: promoCode.name || "",
        description: promoCode.description || "",
        isActive: promoCode.isActive,
        maxRedemptions: promoCode.maxRedemptions?.toString() || "",
        maxRedemptionsPerUser: promoCode.maxRedemptionsPerUser?.toString() || "",
        expiresAt: promoCode.expiresAt
          ? new Date(promoCode.expiresAt).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [promoCode]);

  const utils = trpc.useUtils();

  const updatePromoCode = trpc.promoCodes.update.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      router.push(`/dashboard/${orgId}/promo-codes`);
      router.refresh();
    },
  });

  const deletePromoCode = trpc.promoCodes.delete.useMutation({
    onSuccess: () => {
      utils.promoCodes.list.invalidate();
      router.push(`/dashboard/${orgId}/promo-codes`);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updatePromoCode.mutate({
      promoCodeId,
      name: formData.name || undefined,
      description: formData.description || undefined,
      isActive: formData.isActive,
      maxRedemptions: formData.maxRedemptions
        ? parseInt(formData.maxRedemptions)
        : undefined,
      maxRedemptionsPerUser: formData.maxRedemptionsPerUser
        ? parseInt(formData.maxRedemptionsPerUser)
        : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
    });
  };

  const handleDelete = () => {
    deletePromoCode.mutate({ promoCodeId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !promoCode) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-500">Promo code not found</p>
          <Link
            href={`/dashboard/${orgId}/promo-codes`}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to promo codes
          </Link>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "percentage_discount":
        return "Percentage Discount";
      case "fixed_discount":
        return "Fixed Amount Discount";
      case "free_trial_extension":
        return "Free Trial Extension";
      case "free_subscription":
        return "Free Subscription";
      default:
        return type;
    }
  };

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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edit Promo Code</h1>
            <p className="text-sm font-mono text-muted-foreground">
              {promoCode.code}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {updatePromoCode.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updatePromoCode.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-muted-foreground text-sm">
            Promo Code Details (Read-only)
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Code
              </label>
              <p className="font-mono font-semibold">{promoCode.code}</p>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Type
              </label>
              <p className="font-medium">{getTypeLabel(promoCode.type)}</p>
            </div>
            {promoCode.discountPercent && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Discount
                </label>
                <p className="font-medium">{promoCode.discountPercent}%</p>
              </div>
            )}
            {promoCode.discountAmount && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Discount Amount
                </label>
                <p className="font-medium">${promoCode.discountAmount}</p>
              </div>
            )}
            {promoCode.freeTrialDays && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Free Trial Days
                </label>
                <p className="font-medium">{promoCode.freeTrialDays} days</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Redemptions
              </label>
              <p className="font-medium">{promoCode.currentRedemptions || 0}</p>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Created
              </label>
              <p className="font-medium">
                {new Date(promoCode.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Editable Settings</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Promo code name"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Optional description"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isActive: e.target.checked }))
              }
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active (users can redeem this code)
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Max Redemptions
              </label>
              <input
                type="number"
                value={formData.maxRedemptions}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxRedemptions: e.target.value }))
                }
                placeholder="Unlimited"
                min={1}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Per User
              </label>
              <input
                type="number"
                value={formData.maxRedemptionsPerUser}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    maxRedemptionsPerUser: e.target.value,
                  }))
                }
                placeholder="1"
                min={1}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData((p) => ({ ...p, expiresAt: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Promo Code
          </button>

          <div className="flex gap-3">
            <Link
              href={`/dashboard/${orgId}/promo-codes`}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updatePromoCode.isPending}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {updatePromoCode.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Promo Code?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-mono font-semibold text-foreground">
                {promoCode.code}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePromoCode.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {deletePromoCode.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

