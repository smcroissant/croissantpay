import Link from "next/link";
import { Tag, Plus, Calendar, Users, Percent } from "lucide-react";
import { fetchPromoCodes } from "@/app/actions/dashboard";

export default async function PromoCodesPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const promoCodes = await fetchPromoCodes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">
            Create and manage promotional codes for your apps
          </p>
        </div>
        <Link
          href={`/dashboard/${orgId}/promo-codes/new`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Promo Code</span>
        </Link>
      </div>

      {/* Promo Codes */}
      {!promoCodes || promoCodes.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No promo codes yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create promotional codes to offer discounts, free trials, or free subscriptions to your users.
          </p>
          <Link
            href={`/dashboard/${orgId}/promo-codes/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Promo Code</span>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((promo) => (
            <Link
              key={promo.id}
              href={`/dashboard/${orgId}/promo-codes/${promo.id}/edit`}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    promo.isActive
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {promo.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-1">{promo.name || promo.code}</h3>
              <p className="text-xs font-mono text-muted-foreground mb-2">{promo.code}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {promo.type === "percentage_discount"
                  ? `${promo.discountPercent || promo.discountAmount}% discount`
                  : promo.type === "fixed_discount"
                  ? `$${promo.discountAmount} off`
                  : promo.type === "free_trial_extension"
                  ? `${promo.freeTrialDays || 0} days free trial`
                  : "Free subscription"}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>
                    {promo.redemptionCount || 0} / {promo.maxRedemptions || "∞"} redeemed
                  </span>
                </div>
                {promo.expiresAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Expires {new Date(promo.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

