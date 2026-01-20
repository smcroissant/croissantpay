"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Apple,
  Package,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { createProductSchema, type CreateProductFormData } from "./schemas";

export function CreateProductsStep({ appId }: { appId: string | null }) {
  const [success, setSuccess] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    type: "success" | "error";
    message: string;
    details?: { created: number; updated: number; skipped: number };
  } | null>(null);

  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      identifier: "",
      displayName: "",
      platform: "ios",
      type: "auto_renewable_subscription",
    },
  });

  const utils = trpc.useUtils();
  
  const { data: products, refetch: refetchProducts } = trpc.products.listByApp.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  // Fetch app details to check if App Store Connect is configured
  const { data: app } = trpc.apps.get.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  // Check if App Store Connect is configured
  const hasAppStoreConnect = !!(app?.bundleId && app?.appleKeyId && app?.appleIssuerId && app?.applePrivateKey);

  // Sync from App Store mutation
  const syncFromAppStore = trpc.products.syncFromAppStore.useMutation({
    onSuccess: (result) => {
      setSyncResult({
        type: "success",
        message: result.message || "Products synced successfully!",
        details: {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
        },
      });
      refetchProducts();
    },
    onError: (error) => {
      setSyncResult({
        type: "error",
        message: error.message,
      });
    },
  });

  const handleSync = () => {
    if (!appId) return;
    setSyncResult(null);
    syncFromAppStore.mutate({ appId, updateExisting: true });
  };

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      form.reset();
      utils.products.listByApp.invalidate();
    },
    onError: (err) => {
      form.setError("root", { message: err.message });
    },
  });

  const onSubmit = (data: CreateProductFormData) => {
    if (!appId) return;
    setSuccess(false);

    createProductMutation.mutate({
      appId,
      identifier: data.identifier,
      storeProductId: data.identifier, // Same as identifier by default
      displayName: data.displayName,
      platform: data.platform,
      type: data.type,
    });
  };

  if (!appId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Please create an app first in step 1.</p>
      </div>
    );
  }

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;
  const platform = watch("platform");

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Create products in CroissantPay that map to your in-app purchases in the App Store and Play Store.
      </p>

      {/* Entitlements Info */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-purple-400">Auto-created Entitlements</p>
            <p className="text-xs text-muted-foreground mt-1">
              When you create a product, an <strong>entitlement</strong> is automatically created and linked. 
              Entitlements let you check access in your app without knowing which specific product was purchased 
              (e.g., check <code className="text-purple-300">premium</code> instead of checking monthly, yearly, and lifetime separately).
            </p>
          </div>
        </div>
      </div>

      {/* Sync from App Store Section */}
      {hasAppStoreConnect && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Apple className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-medium text-sm">Sync from App Store Connect</p>
                <p className="text-xs text-muted-foreground">
                  Automatically import your products from App Store Connect
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncFromAppStore.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
            >
              {syncFromAppStore.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Apple className="w-4 h-4" />
                  Sync Products
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sync Result Message */}
      {syncResult && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            syncResult.type === "success"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          {syncResult.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={
                syncResult.type === "success" ? "text-green-400" : "text-red-400"
              }
            >
              {syncResult.message}
            </p>
            {syncResult.details && (
              <p className="text-sm text-muted-foreground mt-1">
                Created: {syncResult.details.created} • Updated:{" "}
                {syncResult.details.updated} • Skipped: {syncResult.details.skipped}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSyncResult(null)}
            className="p-1 hover:bg-background rounded"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Existing Products */}
      {products && products.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Your Products ({products.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
              >
                <div>
                  <p className="font-medium text-sm">{product.displayName}</p>
                  <p className="text-xs text-muted-foreground">{product.identifier} • {product.platform} • {product.type}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Product created successfully! An entitlement was auto-created and linked.
        </div>
      )}

      {errors.root && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errors.root.message}
        </div>
      )}

      {/* Manual Product Creation */}
      <div className="border-t border-border pt-6">
        <h4 className="font-medium mb-4">Or Create Products Manually</h4>
        <div className="bg-secondary/30 rounded-xl p-4 text-sm mb-4">
          <p className="text-muted-foreground">
            <strong>Tip:</strong> If you haven&apos;t configured App Store Connect yet, you can add products manually. 
            Make sure the Product ID matches exactly what you&apos;ve set in App Store Connect or Google Play Console.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Product ID <span className="text-red-500">*</span>
            </label>
            <input
              {...register("identifier")}
              type="text"
              placeholder="premium_monthly"
              className={`w-full px-4 py-3 rounded-xl bg-secondary border ${
                errors.identifier ? "border-red-500" : "border-border"
              } focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.identifier && (
              <p className="text-red-400 text-sm mt-1">{errors.identifier.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("displayName")}
              type="text"
              placeholder="Premium Monthly"
              className={`w-full px-4 py-3 rounded-xl bg-secondary border ${
                errors.displayName ? "border-red-500" : "border-border"
              } focus:border-primary focus:outline-none transition-colors`}
            />
            {errors.displayName && (
              <p className="text-red-400 text-sm mt-1">{errors.displayName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "ios", label: "iOS" },
                { value: "android", label: "Android" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue("platform", opt.value as "ios" | "android")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    platform === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Product Type</label>
            <select
              {...register("type")}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
            >
              <option value="auto_renewable_subscription">Subscription</option>
              <option value="consumable">Consumable</option>
              <option value="non_consumable">Non-Consumable</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={createProductMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createProductMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              Create Product
            </>
          )}
        </button>
      </form>
    </div>
  );
}
