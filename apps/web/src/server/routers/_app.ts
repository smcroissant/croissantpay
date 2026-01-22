import { createTRPCRouter } from "@/server/trpc";
import { appsRouter } from "./apps";
import { productsRouter } from "./products";
import { analyticsRouter } from "./analytics";
import { organizationsRouter } from "./organizations";
import { usersRouter } from "./users";
import { apiLogsRouter } from "./api-logs";
import { subscribersRouter } from "./subscribers";

/**
 * This is the primary router for your server.
 *
 * All routers added in /server/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  apps: appsRouter,
  products: productsRouter,
  analytics: analyticsRouter,
  organizations: organizationsRouter,
  users: usersRouter,
  apiLogs: apiLogsRouter,
  subscribers: subscribersRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;

