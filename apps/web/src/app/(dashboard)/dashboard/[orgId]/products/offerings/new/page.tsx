"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function NewOfferingPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [formData, setFormData] = useState({
    appId: "",
    identifier: "",
    displayName: "",
    isCurrent: false,
  });

  const { data: apps, isLoading: loadingApps } = trpc.apps.list.useQuery();

  const createOffering = trpc.products.createOffering.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/products`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOffering.mutate(formData);
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
      <Link
        href={`/dashboard/${orgId}/products`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create Offering</h1>
        <p className="text-muted-foreground">Group products for your paywall</p>
      </div>

      {createOffering.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {createOffering.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          {apps && apps.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">App</label>
              <select
                value={formData.appId}
                onChange={(e) => setFormData((p) => ({ ...p, appId: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                required
              >
                <option value="">Select an app</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Identifier</label>
            <input
              type="text"
              value={formData.identifier}
              onChange={(e) => setFormData((p) => ({ ...p, identifier: e.target.value }))}
              placeholder="default"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Default Offering"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData((p) => ({ ...p, isCurrent: e.target.checked }))}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="isCurrent" className="font-medium">Set as current offering</label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/${orgId}/products`}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary text-center font-semibold hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createOffering.isPending || !formData.appId || !formData.identifier || !formData.displayName}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createOffering.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Offering"}
          </button>
        </div>
      </form>
    </div>
  );
}

