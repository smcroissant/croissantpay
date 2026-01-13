"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const productId = params.productId as string;

  const [formData, setFormData] = useState({
    displayName: "",
    description: "",
    isActive: true,
  });

  // Fetch product
  const { data: product, isLoading } = trpc.products.get.useQuery(
    { productId },
    { enabled: !!productId }
  );

  useEffect(() => {
    if (product) {
      setFormData({
        displayName: product.displayName,
        description: product.description || "",
        isActive: product.isActive,
      });
    }
  }, [product]);

  // Update mutation
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/products`);
    },
  });

  // Delete mutation
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/products`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate({
      productId,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/dashboard/${orgId}/products`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Edit Product</h1>
        <p className="text-muted-foreground font-mono">{product.identifier}</p>
      </div>

      {updateProduct.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updateProduct.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="isActive" className="font-medium">Active</label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                deleteProduct.mutate({ productId });
              }
            }}
            disabled={deleteProduct.isPending}
            className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <Link
            href={`/dashboard/${orgId}/products`}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary text-center font-semibold hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateProduct.isPending}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

