import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import { subscriber, subscription, app } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const subscribersRouter = createTRPCRouter({
  // List all subscribers for the current organization
  list: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(app.organizationId, ctx.organizationId)];

      // Add app filter if specified
      if (input?.appId) {
        conditions.push(eq(subscriber.appId, input.appId));
      }

      const results = await db
        .select({
          subscriber,
          subscription,
          app,
        })
        .from(subscriber)
        .innerJoin(app, eq(subscriber.appId, app.id))
        .leftJoin(subscription, eq(subscription.subscriberId, subscriber.id))
        .where(and(...conditions))
        .orderBy(desc(subscriber.createdAt))
        .limit(input?.limit ?? 50);

      // Group by subscriber
      const subscribersMap = new Map<
        string,
        {
          subscriber: typeof subscriber.$inferSelect;
          subscriptions: Array<typeof subscription.$inferSelect>;
          app: typeof app.$inferSelect | null;
        }
      >();

      for (const row of results) {
        if (!subscribersMap.has(row.subscriber.id)) {
          subscribersMap.set(row.subscriber.id, {
            subscriber: row.subscriber,
            subscriptions: [],
            app: row.app,
          });
        }
        if (row.subscription) {
          subscribersMap.get(row.subscriber.id)!.subscriptions.push(row.subscription);
        }
      }

      return Array.from(subscribersMap.values());
    }),

  // Get a single subscriber by ID
  get: protectedProcedure
    .input(z.object({ subscriberId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const results = await db
        .select({
          subscriber,
          subscription,
          app,
        })
        .from(subscriber)
        .innerJoin(app, eq(subscriber.appId, app.id))
        .leftJoin(subscription, eq(subscription.subscriberId, subscriber.id))
        .where(
          and(
            eq(subscriber.id, input.subscriberId),
            eq(app.organizationId, ctx.organizationId)
          )
        );

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscriber not found",
        });
      }

      // Group subscriptions
      const subscriptions: Array<typeof subscription.$inferSelect> = [];
      for (const row of results) {
        if (row.subscription) {
          subscriptions.push(row.subscription);
        }
      }

      return {
        subscriber: results[0].subscriber,
        subscriptions,
        app: results[0].app,
      };
    }),
});
