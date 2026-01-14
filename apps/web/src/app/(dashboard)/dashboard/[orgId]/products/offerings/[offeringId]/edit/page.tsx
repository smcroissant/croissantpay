"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Package, Star, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function EditOfferingPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const offeringId = params.offeringId as string;

  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    isCurrent: false,
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch offering
  const {
    data: offering,
    isLoading,
    error,
  } = trpc.products.getOffering.useQuery({ offeringId });

  // Fetch offering products
  const { data: offeringProducts } = trpc.products.getOfferingProducts.useQuery(
    { offeringId },
    { enabled: !!offeringId }
  );

  // Fetch all products for selection
  const { data: allProducts } = trpc.products.list.useQuery();

  // Update form when data loads
  useEffect(() => {
    if (offering) {
      setFormData({
        displayName: offering.displayName,
        description: offering.description || "",
        isCurrent: offering.isCurrent,
      });
    }
  }, [offering]);

  // Update selected products when offeringProducts loads
  useEffect(() => {
    if (offeringProducts) {
      setSelectedProductIds(offeringProducts.map((p) => p.id));
    }
  }, [offeringProducts]);

  const utils = trpc.useUtils();

  const updateOffering = trpc.products.updateOffering.useMutation({
    onSuccess: () => {
      utils.products.listOfferings.invalidate();
    },
  });

  const setOfferingProducts = trpc.products.setOfferingProducts.useMutation({
    onSuccess: () => {
      utils.products.getOfferingProducts.invalidate({ offeringId });
    },
  });

  const deleteOffering = trpc.products.deleteOffering.useMutation({
    onSuccess: () => {
      utils.products.listOfferings.invalidate();
      router.push(`/dashboard/${orgId}/products?tab=offerings`);
      router.refresh();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateOffering.mutateAsync({
      offeringId,
      displayName: formData.displayName,
      description: formData.description || undefined,
      isCurrent: formData.isCurrent,
    });

    await setOfferingProducts.mutateAsync({
      offeringId,
      productIds: selectedProductIds,
    });

    router.push(`/dashboard/${orgId}/products?tab=offerings`);
  };

  const handleDelete = () => {
    deleteOffering.mutate({ offeringId });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-500">Offering not found</p>
          <Link
            href={`/dashboard/${orgId}/products?tab=offerings`}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to offerings
          </Link>
        </div>
      </div>
    );
  }

  const isSaving = updateOffering.isPending || setOfferingProducts.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/${orgId}/products?tab=offerings`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Offerings</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Edit Offering</h1>
              {offering.isCurrent && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                  <Star className="w-3 h-3" /> Default
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-muted-foreground">
              {offering.identifier}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {(updateOffering.error || deleteOffering.error) && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updateOffering.error?.message || deleteOffering.error?.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, displayName: e.target.value }))
              }
              placeholder="Standard Offering"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="A group of products shown on the paywall..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isCurrent: e.target.checked }))
              }
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isCurrent" className="text-sm font-medium">
              Set as default offering
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            The default offering is shown to users when no specific offering is requested.
          </p>
        </div>

        {/* Products */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Products in this Offering</h2>
            <span className="text-sm text-muted-foreground">
              {selectedProductIds.length} selected
            </span>
          </div>

          {allProducts && allProducts.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{product.displayName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {product.identifier}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {product.type.replace(/_/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No products available</p>
              <Link
                href={`/dashboard/${orgId}/products/new`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Product
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={offering.isCurrent}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete Offering
          </button>

          <div className="flex gap-3">
            <Link
              href={`/dashboard/${orgId}/products?tab=offerings`}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving || !formData.displayName}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>

        {offering.isCurrent && (
          <p className="text-xs text-muted-foreground text-center">
            The default offering cannot be deleted. Set another offering as default first.
          </p>
        )}
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Offering?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {offering.displayName}
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
                disabled={deleteOffering.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {deleteOffering.isPending ? (
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
