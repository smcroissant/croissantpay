import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import { apiRequestLog, app } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const apiLogsRouter = createTRPCRouter({
  // List API logs for the organization
  list: protectedProcedure
    .input(
      z.object({
        appId: z.string().uuid().optional(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
        statusMin: z.number().optional(),
        statusMax: z.number().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(apiRequestLog.organizationId, ctx.organizationId)];

      if (input.appId) {
        conditions.push(eq(apiRequestLog.appId, input.appId));
      }

      if (input.method) {
        conditions.push(eq(apiRequestLog.method, input.method));
      }

      const logs = await db
        .select({
          id: apiRequestLog.id,
          method: apiRequestLog.method,
          path: apiRequestLog.path,
          query: apiRequestLog.query,
          headers: apiRequestLog.headers,
          body: apiRequestLog.body,
          statusCode: apiRequestLog.statusCode,
          responseBody: apiRequestLog.responseBody,
          responseTime: apiRequestLog.responseTime,
          ipAddress: apiRequestLog.ipAddress,
          userAgent: apiRequestLog.userAgent,
          apiKeyType: apiRequestLog.apiKeyType,
          apiKeyPrefix: apiRequestLog.apiKeyPrefix,
          subscriberId: apiRequestLog.subscriberId,
          appUserId: apiRequestLog.appUserId,
          errorMessage: apiRequestLog.errorMessage,
          createdAt: apiRequestLog.createdAt,
          appId: apiRequestLog.appId,
          appName: app.name,
        })
        .from(apiRequestLog)
        .leftJoin(app, eq(apiRequestLog.appId, app.id))
        .where(and(...conditions))
        .orderBy(desc(apiRequestLog.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(apiRequestLog)
        .where(and(...conditions));

      return {
        logs,
        total: Number(countResult?.count || 0),
      };
    }),

  // Get stats for the organization
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        success: sql<number>`count(*) filter (where status_code < 400)`,
        clientErrors: sql<number>`count(*) filter (where status_code >= 400 and status_code < 500)`,
        serverErrors: sql<number>`count(*) filter (where status_code >= 500)`,
        avgResponseTime: sql<number>`avg(response_time)`,
      })
      .from(apiRequestLog)
      .where(eq(apiRequestLog.organizationId, ctx.organizationId));

    return {
      total: Number(stats?.total || 0),
      success: Number(stats?.success || 0),
      clientErrors: Number(stats?.clientErrors || 0),
      serverErrors: Number(stats?.serverErrors || 0),
      avgResponseTime: Math.round(Number(stats?.avgResponseTime || 0)),
    };
  }),

  // Create a test log entry (for debugging)
  createTestLog: protectedProcedure.mutation(async ({ ctx }) => {
    // Get the first app for this organization to use in the test
    const [firstApp] = await db
      .select()
      .from(app)
      .where(eq(app.organizationId, ctx.organizationId))
      .limit(1);

    try {
      const [newLog] = await db
        .insert(apiRequestLog)
        .values({
          organizationId: ctx.organizationId,
          appId: firstApp?.id || null,
          method: "GET",
          path: "/api/v1/test",
          query: { test: "true" },
          headers: { "user-agent": "CroissantPay Dashboard Test" },
          body: null,
          statusCode: 200,
          responseBody: { success: true, message: "Test log entry" },
          responseTime: Math.floor(Math.random() * 100) + 10,
          ipAddress: "127.0.0.1",
          userAgent: "CroissantPay Dashboard Test",
          apiKeyType: "test",
          apiKeyPrefix: "mx_test_",
        })
        .returning();

      return {
        success: true,
        logId: newLog.id,
        message: "Test log created successfully",
      };
    } catch (error) {
      console.error("[API Logs] Failed to create test log:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? `Failed to create test log: ${error.message}`
            : "Failed to create test log",
      });
    }
  }),

  // Clear all logs for the organization (dangerous!)
  clearLogs: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(apiRequestLog)
      .where(eq(apiRequestLog.organizationId, ctx.organizationId));

    return { success: true };
  }),
});
