"use client";

import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  Plus,
  Package,
  CreditCard,
  Crown,
  Apple,
  Play,
  Tag,
  Repeat,
  ShoppingBag,
  Loader2,
  Pencil,
  Smartphone,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function ProductsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const searchParams = useSearchParams();
  const filterAppId = searchParams.get("appId");

  // Fetch data using tRPC
  const { data: products, isLoading: loadingProducts } =
    trpc.products.list.useQuery();
  const { data: entitlements, isLoading: loadingEntitlements } =
    trpc.products.listEntitlements.useQuery();
  const { data: offerings, isLoading: loadingOfferings } =
    trpc.products.listOfferings.useQuery();

  const isLoading = loadingProducts || loadingEntitlements || loadingOfferings;

  // Filter by app if appId is in URL
  const filteredProducts = filterAppId
    ? products?.filter((p) => p.appId === filterAppId)
    : products;
  const filteredEntitlements = filterAppId
    ? entitlements?.filter((e) => e.appId === filterAppId)
    : entitlements;
  const filteredOfferings = filterAppId
    ? offerings?.filter((o) => o.appId === filterAppId)
    : offerings;

  // Get the app name for filter display
  const filterAppName = filterAppId
    ? products?.find((p) => p.appId === filterAppId)?.app?.name
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products & Entitlements</h1>
          <p className="text-muted-foreground">
            Manage your in-app products, subscriptions, and access control
          </p>
        </div>
      </div>

      {/* Filter Badge */}
      {filterAppId && filterAppName && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtering by app:</span>
          <Link
            href={`/dashboard/${orgId}/products`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            {filterAppName}
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Products Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Products
            {filterAppId && filteredProducts && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredProducts.length})
              </span>
            )}
          </h2>
          <Link
            href={`/dashboard/${orgId}/products/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>

        {!filteredProducts || filteredProducts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={filterAppId ? "No products for this app" : "No products yet"}
            description={filterAppId ? "Create a product for this app" : "Create products to map your App Store and Play Store items"}
            actionLabel="Add Product"
            actionHref={`/dashboard/${orgId}/products/new`}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} orgId={orgId} />
            ))}
          </div>
        )}
      </section>

      {/* Entitlements Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Entitlements
            {filterAppId && filteredEntitlements && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredEntitlements.length})
              </span>
            )}
          </h2>
          <Link
            href={`/dashboard/${orgId}/products/entitlements/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entitlement</span>
          </Link>
        </div>

        {!filteredEntitlements || filteredEntitlements.length === 0 ? (
          <EmptyState
            icon={Crown}
            title={filterAppId ? "No entitlements for this app" : "No entitlements yet"}
            description={filterAppId ? "Create an entitlement for this app" : "Entitlements define what features users unlock with purchases"}
            actionLabel="Add Entitlement"
            actionHref={`/dashboard/${orgId}/products/entitlements/new`}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntitlements.map((e) => (
              <EntitlementCard key={e.id} entitlement={e} orgId={orgId} />
            ))}
          </div>
        )}
      </section>

      {/* Offerings Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Offerings
            {filterAppId && filteredOfferings && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredOfferings.length})
              </span>
            )}
          </h2>
          <Link
            href={`/dashboard/${orgId}/products/offerings/new`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Offering</span>
          </Link>
        </div>

        {!filteredOfferings || filteredOfferings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={filterAppId ? "No offerings for this app" : "No offerings yet"}
            description={filterAppId ? "Create an offering for this app" : "Offerings group products for your paywall display"}
            actionLabel="Add Offering"
            actionHref={`/dashboard/${orgId}/products/offerings/new`}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfferings.map((o) => (
              <OfferingCard key={o.id} offering={o} orgId={orgId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface AppInfo {
  id: string;
  name: string;
}

interface Product {
  id: string;
  identifier: string;
  displayName: string;
  storeProductId: string;
  platform: string;
  type: string;
  subscriptionPeriod: string | null;
  isActive: boolean;
  app: AppInfo | null;
  appId: string;
}

function ProductCard({ product: p, orgId }: { product: Product; orgId: string }) {
  const typeIcons: Record<string, React.ReactNode> = {
    auto_renewable_subscription: <Repeat className="w-4 h-4" />,
    non_renewing_subscription: <Repeat className="w-4 h-4" />,
    consumable: <Package className="w-4 h-4" />,
    non_consumable: <Tag className="w-4 h-4" />,
  };

  const typeLabels: Record<string, string> = {
    auto_renewable_subscription: "Auto-renewable",
    non_renewing_subscription: "Non-renewing",
    consumable: "Consumable",
    non_consumable: "Non-consumable",
  };

  return (
    <Link
      href={`/dashboard/${orgId}/products/${p.id}/edit`}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {p.platform === "ios" ? (
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Apple className="w-4 h-4 text-blue-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-green-400" />
            </div>
          )}
          <div>
            <p className="font-medium">{p.displayName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {p.identifier}
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* App Name */}
      {p.app && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
          <Smartphone className="w-3 h-3" />
          <span>{p.app.name}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs">
          {typeIcons[p.type]}
          {typeLabels[p.type]}
        </span>
        {p.subscriptionPeriod && (
          <span className="text-xs text-muted-foreground">
            {p.subscriptionPeriod}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-mono truncate">
        Store ID: {p.storeProductId}
      </p>

      {!p.isActive && (
        <span className="inline-flex px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs mt-2">
          Inactive
        </span>
      )}
    </Link>
  );
}

interface Entitlement {
  id: string;
  identifier: string;
  displayName: string;
  description: string | null;
  app: AppInfo | null;
  appId: string;
}

function EntitlementCard({ entitlement: e, orgId }: { entitlement: Entitlement; orgId: string }) {
  return (
    <Link
      href={`/dashboard/${orgId}/products/entitlements/${e.id}/edit`}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{e.displayName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {e.identifier}
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* App Name */}
      {e.app && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
          <Smartphone className="w-3 h-3" />
          <span>{e.app.name}</span>
        </div>
      )}

      {e.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {e.description}
        </p>
      )}
    </Link>
  );
}

interface Offering {
  id: string;
  identifier: string;
  displayName: string;
  isCurrent: boolean;
  app: AppInfo | null;
  appId: string;
}

function OfferingCard({ offering: o, orgId }: { offering: Offering; orgId: string }) {
  return (
    <Link
      href={`/dashboard/${orgId}/products/offerings/${o.id}/edit`}
      className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors block group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="font-medium">{o.displayName}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {o.identifier}
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* App Name */}
      {o.app && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
          <Smartphone className="w-3 h-3" />
          <span>{o.app.name}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {o.isCurrent && (
          <span className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
            Current
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </Link>
    </div>
  );
}

