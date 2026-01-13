import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import {
  user,
  session,
  organization,
  organizationMember,
} from "@/lib/db/schema";
import { getUserOrganizations } from "@/lib/services/organizations";

export const usersRouter = createTRPCRouter({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      image: ctx.user.image,
    };
  }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify email matches
      if (input.confirmEmail !== ctx.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email confirmation does not match your account email",
        });
      }

      // Check if user owns any organizations
      const userOrgs = await getUserOrganizations(ctx.user.id);
      const ownedOrgs = userOrgs.filter((org) => org.role === "owner");

      // For owned organizations with other members, require transfer first
      for (const org of ownedOrgs) {
        const members = await db
          .select()
          .from(organizationMember)
          .where(eq(organizationMember.organizationId, org.id));

        if (members.length > 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You must transfer ownership of "${org.name}" to another member or remove all members before deleting your account.`,
          });
        }
      }

      // Delete owned organizations (single-member)
      for (const org of ownedOrgs) {
        await db.delete(organization).where(eq(organization.id, org.id));
      }

      // Remove user from other organizations (where not owner)
      const memberOrgs = userOrgs.filter((org) => org.role !== "owner");
      for (const org of memberOrgs) {
        await db
          .delete(organizationMember)
          .where(
            and(
              eq(organizationMember.organizationId, org.id),
              eq(organizationMember.userId, ctx.user.id)
            )
          );
      }

      // Delete all sessions first
      await db.delete(session).where(eq(session.userId, ctx.user.id));

      // Delete the user (cascades to account table)
      await db.delete(user).where(eq(user.id, ctx.user.id));

      return { success: true };
    }),
});

