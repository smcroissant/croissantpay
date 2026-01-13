import { createTRPCRouter } from "@/server/trpc";
import { appsRouter } from "./apps";
import { productsRouter } from "./products";
import { analyticsRouter } from "./analytics";
import { promoCodesRouter } from "./promo-codes";
import { experimentsRouter } from "./experiments";
import { organizationsRouter } from "./organizations";
import { usersRouter } from "./users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /server/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  apps: appsRouter,
  products: productsRouter,
  analytics: analyticsRouter,
  promoCodes: promoCodesRouter,
  experiments: experimentsRouter,
  organizations: organizationsRouter,
  users: usersRouter,
});

// Export type router type signature
export type AppRouter = typeof appRouter;

