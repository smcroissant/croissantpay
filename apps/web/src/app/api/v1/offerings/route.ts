import { NextRequest } from "next/server";
import { withApiKey, successResponse } from "@/lib/api/middleware";
import { db } from "@/lib/db";
import {
  offering,
  offeringProduct,
  product,
  productEntitlement,
  entitlement,
  subscriber,
} from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { getOfferingForSubscriber } from "@/lib/services/experiments";

// Package type detection based on subscription period
function getPackageType(
  subscriptionPeriod: string | null,
  productType: string
): string {
  if (!subscriptionPeriod) {
    if (productType === "non_consumable") return "lifetime";
    return "custom";
  }

  const match = subscriptionPeriod.match(/P(\d+)([DWMY])/);
  if (!match) return "custom";

  const [, count, unit] = match;
  const num = parseInt(count, 10);

  switch (unit) {
    case "D":
      return num === 7 ? "weekly" : "custom";
    case "W":
      return num === 1 ? "weekly" : "custom";
    case "M":
      if (num === 1) return "monthly";
      if (num === 2) return "two_month";
      if (num === 3) return "three_month";
      if (num === 6) return "six_month";
      return "custom";
    case "Y":
      return num === 1 ? "annual" : "custom";
    default:
      return "custom";
  }
}

// Build package identifier from product
function getPackageIdentifier(packageType: string, identifier: string): string {
  const typeToPrefix: Record<string, string> = {
    lifetime: "$rc_lifetime",
    annual: "$rc_annual",
    six_month: "$rc_six_month",
    three_month: "$rc_three_month",
    two_month: "$rc_two_month",
    monthly: "$rc_monthly",
    weekly: "$rc_weekly",
  };

  return typeToPrefix[packageType] || identifier;
}

// Build offering response with products and packages
async function buildOfferingResponse(off: typeof offering.$inferSelect) {
  // Get products in this offering
  const offeringProducts = await db
    .select({
      offeringProduct: offeringProduct,
      product: product,
    })
    .from(offeringProduct)
    .leftJoin(product, eq(offeringProduct.productId, product.id))
    .where(eq(offeringProduct.offeringId, off.id))
    .orderBy(asc(offeringProduct.position));

  const productsWithEntitlements = await Promise.all(
    offeringProducts.map(async ({ product: prod }) => {
      if (!prod) return null;

      // Get entitlements for this product
      const productEntitlements = await db
        .select({
          entitlement: entitlement,
        })
        .from(productEntitlement)
        .leftJoin(
          entitlement,
          eq(productEntitlement.entitlementId, entitlement.id)
        )
        .where(eq(productEntitlement.productId, prod.id));

      return {
        identifier: prod.identifier,
        storeProductId: prod.storeProductId,
        platform: prod.platform,
        type: prod.type,
        displayName: prod.displayName,
        description: prod.description,
        subscriptionPeriod: prod.subscriptionPeriod,
        trialDuration: prod.trialDuration,
        entitlements: productEntitlements
          .filter((pe) => pe.entitlement)
          .map((pe) => pe.entitlement!.identifier),
      };
    })
  );

  const validProducts = productsWithEntitlements.filter(Boolean) as NonNullable<
    (typeof productsWithEntitlements)[0]
  >[];

  // Build packages from products
  const packages = validProducts.map((prod) => {
    const packageType = getPackageType(prod.subscriptionPeriod, prod.type);
    return {
      identifier: getPackageIdentifier(packageType, prod.identifier),
      packageType,
      product: prod,
    };
  });

  // Create named package shortcuts
  const packageShortcuts: Record<string, (typeof packages)[0] | undefined> = {};
  packages.forEach((pkg) => {
    if (pkg.packageType !== "custom" && pkg.packageType !== "unknown") {
      packageShortcuts[pkg.packageType] = pkg;
    }
  });

  return {
    identifier: off.identifier,
    displayName: off.displayName,
    description: off.description,
    isCurrent: off.isCurrent,
    metadata: off.metadata,
    products: validProducts,
    packages,
    // Named package shortcuts
    lifetime: packageShortcuts.lifetime,
    annual: packageShortcuts.annual,
    sixMonth: packageShortcuts.six_month,
    threeMonth: packageShortcuts.three_month,
    twoMonth: packageShortcuts.two_month,
    monthly: packageShortcuts.monthly,
    weekly: packageShortcuts.weekly,
  };
}

export async function GET(request: NextRequest) {
  return withApiKey(request, async ({ app }) => {
    // Check for subscriber ID in headers or query params (for A/B testing)
    const { searchParams } = new URL(request.url);
    const appUserId = searchParams.get("appUserId");
    const platform = searchParams.get("platform") as "ios" | "android" | null;
    const appVersion = searchParams.get("appVersion");
    const country = searchParams.get("country");

    let experimentInfo: {
      experimentId?: string;
      variantId?: string;
      paywallConfig?: Record<string, unknown>;
    } | null = null;

    // If we have a subscriber, check for A/B test assignment
    if (appUserId) {
      const [sub] = await db
        .select()
        .from(subscriber)
        .where(
          and(
            eq(subscriber.appId, app.id),
            eq(subscriber.appUserId, appUserId)
          )
        )
        .limit(1);

      if (sub) {
        const experimentResult = await getOfferingForSubscriber(
          app.id,
          sub.id,
          {
            platform: platform || undefined,
            appVersion: appVersion || undefined,
            country: country || undefined,
          }
        );

        if (experimentResult) {
          experimentInfo = {
            experimentId: experimentResult.experimentId,
            variantId: experimentResult.variantId,
            paywallConfig: experimentResult.paywallConfig,
          };

          // If experiment specifies a different offering, use that
          if (experimentResult.offeringId) {
            const [expOffering] = await db
              .select()
              .from(offering)
              .where(eq(offering.id, experimentResult.offeringId))
              .limit(1);

            if (expOffering) {
              const offeringData = await buildOfferingResponse(expOffering);

              return successResponse({
                currentOfferingId: expOffering.identifier,
                current: offeringData,
                offerings: { [expOffering.identifier]: offeringData },
                experiment: experimentInfo,
              });
            }
          }
        }
      }
    }

    // Get all offerings for this app (default behavior)
    const offerings = await db
      .select()
      .from(offering)
      .where(eq(offering.appId, app.id))
      .orderBy(asc(offering.identifier));

    // Get current offering
    const currentOffering = offerings.find((o) => o.isCurrent);

    // Build offerings response with products and packages
    const offeringsWithProducts = await Promise.all(
      offerings.map(buildOfferingResponse)
    );

    // Build response with offerings keyed by identifier
    const offeringsMap = offeringsWithProducts.reduce(
      (acc, off) => {
        acc[off.identifier] = off;
        return acc;
      },
      {} as Record<string, (typeof offeringsWithProducts)[0]>
    );

    return successResponse({
      currentOfferingId: currentOffering?.identifier ?? null,
      current: currentOffering
        ? offeringsMap[currentOffering.identifier]
        : null,
      offerings: offeringsMap,
      experiment: experimentInfo,
    });
  });
}
