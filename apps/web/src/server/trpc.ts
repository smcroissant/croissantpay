import { initTRPC, TRPCError } from "@trpc/server";
import { headers, cookies } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { getUserOrganizations, createOrganization } from "@/lib/services/organizations";
import { db } from "@/lib/db";
import { app } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Context for tRPC procedures
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Get selected organization from cookies
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("selectedOrgId")?.value;

  return {
    session,
    db,
    selectedOrgId,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 * Requires a valid session
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Get or create organization for user
  let organizations = await getUserOrganizations(ctx.session.user.id);

  if (organizations.length === 0) {
    // Auto-create a default organization for the user
    const userSlug =
      ctx.session.user.email?.split("@")[0] ||
      `user-${ctx.session.user.id.slice(0, 8)}`;
    const newOrg = await createOrganization({
      name: `${ctx.session.user.name || userSlug}'s Organization`,
      slug: userSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      ownerId: ctx.session.user.id,
    });
    organizations = [{ ...newOrg, role: "owner" }];
  }

  // Use selected organization from cookie, or default to first one
  let selectedOrg = organizations[0];
  if (ctx.selectedOrgId) {
    const foundOrg = organizations.find((o) => o.id === ctx.selectedOrgId);
    if (foundOrg) {
      selectedOrg = foundOrg;
    }
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      organizationId: selectedOrg.id,
      organization: selectedOrg,
    },
  });
});

/**
 * Procedure that requires access to a specific app
 * Note: This validates app access after input is parsed via .input() in the procedure chain
 */
export const appProcedure = protectedProcedure.use(
  async (opts) => {
    const { ctx, next } = opts;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input = (opts as any).rawInput as { appId?: string } | undefined;

    if (!input?.appId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "appId is required",
      });
    }

    // Verify app belongs to user's organization
    const [appData] = await db
      .select()
      .from(app)
      .where(
        and(eq(app.id, input.appId), eq(app.organizationId, ctx.organizationId))
      )
      .limit(1);

    if (!appData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "App not found",
      });
    }

    return next({
      ctx: {
        ...ctx,
        app: appData,
      },
    });
  }
);

