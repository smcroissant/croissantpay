import { NextRequest, NextResponse } from "next/server";
import { runSubscriptionLifecycle } from "@/lib/services/subscription-lifecycle";
import { resetMonthlyUsage } from "@/lib/services/usage";
import { db } from "@/lib/db";
import { organizationBilling } from "@/lib/db/schema-billing";
import { lte } from "drizzle-orm";
import { isCloudMode } from "@/lib/config";

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET || "your-cron-secret";

// POST /api/cron/subscriptions
// This endpoint should be called by a cron job (e.g., every hour)
// Example cron setup with Vercel: vercel.json crons config
// Or use external service like cron-job.org, Upstash, etc.
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Run subscription lifecycle checks
    console.log("[Cron] Running subscription lifecycle...");
    const lifecycleResult = await runSubscriptionLifecycle();
    results.lifecycle = {
      expiring: lifecycleResult.expiring.processed,
      expired: lifecycleResult.expired.processed,
      trials: lifecycleResult.trials.processed,
      gracePeriods: lifecycleResult.gracePeriods.processed,
    };

    // 2. Reset monthly usage for organizations (if cloud mode)
    if (isCloudMode()) {
      console.log("[Cron] Checking usage reset...");
      const now = new Date();

      // Find organizations that need usage reset
      const orgsToReset = await db
        .select()
        .from(organizationBilling)
        .where(lte(organizationBilling.usageResetAt, now));

      let resetCount = 0;
      for (const org of orgsToReset) {
        try {
          await resetMonthlyUsage(org.organizationId);
          resetCount++;
        } catch (err) {
          console.error(`Failed to reset usage for ${org.organizationId}:`, err);
        }
      }

      results.usageReset = resetCount;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cron job failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/cron/subscriptions",
    description: "Subscription lifecycle cron job",
  });
}

