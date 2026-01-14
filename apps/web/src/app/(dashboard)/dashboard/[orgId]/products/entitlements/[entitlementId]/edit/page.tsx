"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function EditEntitlementPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const entitlementId = params.entitlementId as string;

  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch entitlement
  const {
    data: entitlement,
    isLoading,
    error,
  } = trpc.products.getEntitlement.useQuery({ entitlementId });

  // Update form when data loads
  useEffect(() => {
    if (entitlement) {
      setFormData({
        displayName: entitlement.displayName,
        description: entitlement.description || "",
      });
    }
  }, [entitlement]);

  const utils = trpc.useUtils();

  const updateEntitlement = trpc.products.updateEntitlement.useMutation({
    onSuccess: () => {
      utils.products.listEntitlements.invalidate();
      router.push(`/dashboard/${orgId}/products?tab=entitlements`);
      router.refresh();
    },
  });

  const deleteEntitlement = trpc.products.deleteEntitlement.useMutation({
    onSuccess: () => {
      utils.products.listEntitlements.invalidate();
      router.push(`/dashboard/${orgId}/products?tab=entitlements`);
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateEntitlement.mutate({
      entitlementId,
      displayName: formData.displayName,
      description: formData.description || undefined,
    });
  };

  const handleDelete = () => {
    deleteEntitlement.mutate({ entitlementId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !entitlement) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-500">Entitlement not found</p>
          <Link
            href={`/dashboard/${orgId}/products?tab=entitlements`}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to entitlements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/${orgId}/products?tab=entitlements`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Entitlements</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Edit Entitlement</h1>
            <p className="text-sm font-mono text-muted-foreground">
              {entitlement.identifier}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {updateEntitlement.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updateEntitlement.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Editable fields */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, displayName: e.target.value }))
              }
              placeholder="Pro Access"
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
              placeholder="Grants access to pro features..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            <strong>Note:</strong> The identifier cannot be changed after creation as it may be used in your app&apos;s code.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Entitlement
          </button>

          <div className="flex gap-3">
            <Link
              href={`/dashboard/${orgId}/products?tab=entitlements`}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateEntitlement.isPending || !formData.displayName}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {updateEntitlement.isPending ? (
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
            <h3 className="text-lg font-semibold mb-2">Delete Entitlement?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {entitlement.displayName}
              </span>
              ? This will remove the entitlement from all products and cannot be undone.
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
                disabled={deleteEntitlement.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {deleteEntitlement.isPending ? (
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
