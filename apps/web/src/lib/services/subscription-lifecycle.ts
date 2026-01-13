import { db } from "@/lib/db";
import {
  subscription,
  subscriberEntitlement,
  subscriber,
  product,
  app,
} from "@/lib/db/schema";
import { eq, and, lte, gte, sql, inArray } from "drizzle-orm";
import { sendEmail } from "./email";

// Types for subscription lifecycle events
export type LifecycleEvent =
  | "subscription_will_expire"
  | "subscription_expired"
  | "trial_will_end"
  | "trial_ended"
  | "grace_period_started"
  | "grace_period_ended"
  | "billing_retry_started";

interface LifecycleResult {
  processed: number;
  errors: number;
  details: Array<{ subscriberId: string; event: LifecycleEvent; success: boolean }>;
}

// Check and update expiring subscriptions
export async function processExpiringSubscriptions(): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, errors: 0, details: [] };

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find subscriptions expiring in 24 hours (for renewal reminder)
  const expiringIn24h = await db
    .select({
      subscription,
      subscriber,
      product,
    })
    .from(subscription)
    .innerJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
    .innerJoin(product, eq(subscription.productId, product.id))
    .where(
      and(
        eq(subscription.status, "active"),
        eq(subscription.autoRenewEnabled, false),
        gte(subscription.expiresDate, now),
        lte(subscription.expiresDate, in24Hours)
      )
    );

  for (const record of expiringIn24h) {
    try {
      // Log the event (could send notification via webhook)
      console.log(
        `Subscription ${record.subscription.id} for ${record.subscriber.appUserId} expires in 24h`
      );

      result.details.push({
        subscriberId: record.subscriber.id,
        event: "subscription_will_expire",
        success: true,
      });
      result.processed++;
    } catch (err) {
      result.errors++;
      result.details.push({
        subscriberId: record.subscriber.id,
        event: "subscription_will_expire",
        success: false,
      });
    }
  }

  return result;
}

// Process expired subscriptions
export async function processExpiredSubscriptions(): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, errors: 0, details: [] };
  const now = new Date();

  // Find subscriptions that have expired
  const expiredSubs = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.status, "active"),
        lte(subscription.expiresDate, now)
      )
    );

  for (const sub of expiredSubs) {
    try {
      // Update subscription status
      await db
        .update(subscription)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(eq(subscription.id, sub.id));

      // Deactivate entitlements
      await db
        .update(subscriberEntitlement)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(eq(subscriberEntitlement.subscriptionId, sub.id));

      result.details.push({
        subscriberId: sub.subscriberId,
        event: "subscription_expired",
        success: true,
      });
      result.processed++;
    } catch (err) {
      result.errors++;
      result.details.push({
        subscriberId: sub.subscriberId,
        event: "subscription_expired",
        success: false,
      });
    }
  }

  return result;
}

// Process trial expirations
export async function processTrialExpirations(): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, errors: 0, details: [] };
  const now = new Date();

  // Find trials that have ended
  const endedTrials = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.isTrialPeriod, true),
        lte(subscription.expiresDate, now)
      )
    );

  for (const sub of endedTrials) {
    try {
      // If auto-renew is enabled, convert to paid subscription
      // Otherwise mark as expired
      if (sub.autoRenewEnabled) {
        await db
          .update(subscription)
          .set({
            isTrialPeriod: false,
            updatedAt: now,
          })
          .where(eq(subscription.id, sub.id));
      } else {
        await db
          .update(subscription)
          .set({
            isTrialPeriod: false,
            status: "expired",
            updatedAt: now,
          })
          .where(eq(subscription.id, sub.id));

        // Deactivate entitlements
        await db
          .update(subscriberEntitlement)
          .set({
            isActive: false,
            updatedAt: now,
          })
          .where(eq(subscriberEntitlement.subscriptionId, sub.id));
      }

      result.details.push({
        subscriberId: sub.subscriberId,
        event: "trial_ended",
        success: true,
      });
      result.processed++;
    } catch (err) {
      result.errors++;
      result.details.push({
        subscriberId: sub.subscriberId,
        event: "trial_ended",
        success: false,
      });
    }
  }

  return result;
}

// Process grace periods
export async function processGracePeriods(): Promise<LifecycleResult> {
  const result: LifecycleResult = { processed: 0, errors: 0, details: [] };
  const now = new Date();

  // Find subscriptions in grace period that have expired
  const expiredGrace = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.status, "in_grace_period"),
        lte(subscription.gracePeriodExpiresDate, now)
      )
    );

  for (const sub of expiredGrace) {
    try {
      // Grace period ended - mark as billing retry or expired
      await db
        .update(subscription)
        .set({
          status: "in_billing_retry",
          updatedAt: now,
        })
        .where(eq(subscription.id, sub.id));

      result.details.push({
        subscriberId: sub.subscriberId,
        event: "grace_period_ended",
        success: true,
      });
      result.processed++;
    } catch (err) {
      result.errors++;
      result.details.push({
        subscriberId: sub.subscriberId,
        event: "grace_period_ended",
        success: false,
      });
    }
  }

  return result;
}

// Main lifecycle processor - run periodically
export async function runSubscriptionLifecycle(): Promise<{
  expiring: LifecycleResult;
  expired: LifecycleResult;
  trials: LifecycleResult;
  gracePeriods: LifecycleResult;
}> {
  console.log("[Lifecycle] Starting subscription lifecycle check...");

  const [expiring, expired, trials, gracePeriods] = await Promise.all([
    processExpiringSubscriptions(),
    processExpiredSubscriptions(),
    processTrialExpirations(),
    processGracePeriods(),
  ]);

  console.log(`[Lifecycle] Expiring: ${expiring.processed} processed, ${expiring.errors} errors`);
  console.log(`[Lifecycle] Expired: ${expired.processed} processed, ${expired.errors} errors`);
  console.log(`[Lifecycle] Trials: ${trials.processed} processed, ${trials.errors} errors`);
  console.log(`[Lifecycle] Grace: ${gracePeriods.processed} processed, ${gracePeriods.errors} errors`);

  return { expiring, expired, trials, gracePeriods };
}

// Get subscription health metrics
export async function getSubscriptionHealth(organizationId: string): Promise<{
  active: number;
  expiringSoon: number;
  inTrial: number;
  inGracePeriod: number;
  churned30Days: number;
}> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get app IDs for organization
  const apps = await db
    .select({ id: app.id })
    .from(app)
    .where(eq(app.organizationId, organizationId));

  const appIds = apps.map((a) => a.id);

  if (appIds.length === 0) {
    return {
      active: 0,
      expiringSoon: 0,
      inTrial: 0,
      inGracePeriod: 0,
      churned30Days: 0,
    };
  }

  const [stats] = await db
    .select({
      active: sql<number>`count(*) filter (where ${subscription.status} = 'active')`,
      expiringSoon: sql<number>`count(*) filter (where ${subscription.status} = 'active' and ${subscription.expiresDate} <= ${in7Days})`,
      inTrial: sql<number>`count(*) filter (where ${subscription.isTrialPeriod} = true)`,
      inGracePeriod: sql<number>`count(*) filter (where ${subscription.status} = 'in_grace_period')`,
      churned30Days: sql<number>`count(*) filter (where ${subscription.status} = 'expired' and ${subscription.updatedAt} >= ${thirtyDaysAgo})`,
    })
    .from(subscription)
    .innerJoin(subscriber, eq(subscription.subscriberId, subscriber.id))
    .where(inArray(subscriber.appId, appIds));

  return {
    active: Number(stats?.active || 0),
    expiringSoon: Number(stats?.expiringSoon || 0),
    inTrial: Number(stats?.inTrial || 0),
    inGracePeriod: Number(stats?.inGracePeriod || 0),
    churned30Days: Number(stats?.churned30Days || 0),
  };
}

