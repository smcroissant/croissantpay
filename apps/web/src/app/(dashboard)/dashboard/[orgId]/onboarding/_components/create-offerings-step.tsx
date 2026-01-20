"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Layers,
  Plus,
  Trash2,
  Check,
  GripVertical,
  Star,
  Package,
  Info,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const createOfferingSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  isCurrent: z.boolean().default(false),
});

type CreateOfferingFormData = z.infer<typeof createOfferingSchema>;

interface CreateOfferingsStepProps {
  appId: string | null;
}

export function CreateOfferingsStep({ appId }: CreateOfferingsStepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const utils = trpc.useUtils();

  const { data: offerings, isLoading: loadingOfferings } =
    trpc.products.listOfferingsByApp.useQuery(
      { appId: appId! },
      { enabled: !!appId }
    );

  const { data: products, isLoading: loadingProducts } =
    trpc.products.listByApp.useQuery(
      { appId: appId! },
      { enabled: !!appId }
    );

  const { data: offeringProducts } = trpc.products.getOfferingProducts.useQuery(
    { offeringId: selectedOfferingId! },
    { enabled: !!selectedOfferingId }
  );

  const createOfferingMutation = trpc.products.createOffering.useMutation({
    onSuccess: () => {
      utils.products.listOfferingsByApp.invalidate({ appId: appId! });
      setIsCreating(false);
      reset();
    },
  });

  const deleteOfferingMutation = trpc.products.deleteOffering.useMutation({
    onSuccess: () => {
      utils.products.listOfferingsByApp.invalidate({ appId: appId! });
      if (selectedOfferingId) {
        setSelectedOfferingId(null);
        setSelectedProductIds([]);
      }
    },
  });

  const updateOfferingMutation = trpc.products.updateOffering.useMutation({
    onSuccess: () => {
      utils.products.listOfferingsByApp.invalidate({ appId: appId! });
    },
  });

  const setOfferingProductsMutation = trpc.products.setOfferingProducts.useMutation({
    onSuccess: () => {
      utils.products.getOfferingProducts.invalidate({ offeringId: selectedOfferingId! });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema),
    defaultValues: {
      isCurrent: false,
    },
  });

  const onSubmit = (data: CreateOfferingFormData) => {
    if (!appId) return;
    createOfferingMutation.mutate({
      appId,
      ...data,
    });
  };

  const handleSetCurrent = (offeringId: string) => {
    updateOfferingMutation.mutate({
      offeringId,
      isCurrent: true,
    });
  };

  const handleSelectOffering = (offeringId: string) => {
    setSelectedOfferingId(offeringId);
    // Load existing products for this offering
    const existingProducts = offeringProducts?.map((op) => op.productId) || [];
    setSelectedProductIds(existingProducts);
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveProducts = () => {
    if (!selectedOfferingId) return;
    setOfferingProductsMutation.mutate({
      offeringId: selectedOfferingId,
      productIds: selectedProductIds,
    });
  };

  // Update selected products when offering products are loaded
  useState(() => {
    if (offeringProducts) {
      setSelectedProductIds(offeringProducts.map((op) => op.productId));
    }
  });

  if (!appId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Please create an app first to configure offerings.
        </p>
      </div>
    );
  }

  const isLoading = loadingOfferings || loadingProducts;

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-400 mb-1">What are Offerings?</h3>
            <p className="text-sm text-muted-foreground">
              Offerings are groups of products that you can present to users in your paywall.
              The <strong>current offering</strong> is the default one shown to users via the SDK.
              You can have multiple offerings for A/B testing or different user segments.
            </p>
          </div>
        </div>
      </div>

      {/* SDK Code Preview */}
      <div className="bg-secondary/30 rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-2">
          After setup, you&apos;ll access offerings in your app like this:
        </p>
        <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto">
          <code className="text-green-400">{`const { offerings } = usePurchases();

// Get the current (default) offering
const currentOffering = offerings?.current;

// Get available packages/products
const packages = currentOffering?.availablePackages;`}</code>
        </pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Offerings List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Offerings</h3>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Offering
              </button>
            )}
          </div>

          {isCreating && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-secondary/50 rounded-xl p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Identifier
                </label>
                <input
                  {...register("identifier")}
                  placeholder="e.g., default, premium_yearly"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                />
                {errors.identifier && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <input
                  {...register("displayName")}
                  placeholder="e.g., Default Offering"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                />
                {errors.displayName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <input
                  {...register("description")}
                  placeholder="e.g., Main subscription offering"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isCurrent")}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Set as current (default) offering</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createOfferingMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                >
                  {createOfferingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Create Offering"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    reset();
                  }}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !offerings || offerings.length === 0 ? (
            <div className="bg-secondary/30 rounded-xl p-8 text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">No offerings yet</p>
              <p className="text-xs text-muted-foreground">
                Create an offering to group your products
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {offerings.map((offering) => (
                <div
                  key={offering.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                    selectedOfferingId === offering.id
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/30 border-transparent hover:border-border"
                  }`}
                  onClick={() => handleSelectOffering(offering.id)}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {offering.displayName}
                      </span>
                      {offering.isCurrent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500">
                          <Star className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {offering.identifier}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!offering.isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCurrent(offering.id);
                        }}
                        disabled={updateOfferingMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        title="Set as current"
                      >
                        <Star className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this offering?")) {
                          deleteOfferingMutation.mutate({ offeringId: offering.id });
                        }
                      }}
                      disabled={deleteOfferingMutation.isPending}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Products Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {selectedOfferingId ? "Select Products" : "Products"}
            </h3>
            {selectedOfferingId && selectedProductIds.length > 0 && (
              <button
                onClick={handleSaveProducts}
                disabled={setOfferingProductsMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {setOfferingProductsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Products
              </button>
            )}
          </div>

          {!selectedOfferingId ? (
            <div className="bg-secondary/30 rounded-xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Select an offering to add products
              </p>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="bg-secondary/30 rounded-xl p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">No products available</p>
              <p className="text-xs text-muted-foreground">
                Go back to the Products step to create some
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {products.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => handleToggleProduct(product.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-secondary/30 border-transparent hover:border-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {product.displayName}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            product.platform === "ios"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-green-500/10 text-green-500"
                          }`}
                        >
                          {product.platform === "ios" ? "iOS" : "Android"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {product.storeProductId}
                      </p>
                      {product.type === "auto_renewable_subscription" && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {product.subscriptionPeriod || "Subscription"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedOfferingId && products && products.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {selectedProductIds.length} product(s) selected
            </p>
          )}
        </div>
      </div>

      {/* Success State */}
      {offerings && offerings.length > 0 && offerings.some((o) => o.isCurrent) && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium text-green-400">Offerings configured!</h4>
              <p className="text-sm text-muted-foreground">
                You have a current offering set up. Your SDK can now fetch it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
