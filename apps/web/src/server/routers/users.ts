import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { db } from "@/lib/db";
import {
  user,
  session,
  organization,
  organizationMember,
} from "@/lib/db/schema";

export const usersRouter = createTRPCRouter({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    // Fetch user with 2FA status from database
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, ctx.user.id));

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      twoFactorEnabled: userData.twoFactorEnabled ?? false,
      createdAt: userData.createdAt,
    };
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(user)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id))
        .returning();

      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
      };
    }),

  // Get active sessions
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await db
      .select({
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      })
      .from(session)
      .where(eq(session.userId, ctx.user.id))
      .orderBy(desc(session.createdAt));

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === ctx.session?.id,
    }));
  }),

  // Revoke a session
  revokeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Don't allow revoking current session via this method
      if (input.sessionId === ctx.session?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot revoke current session. Use sign out instead.",
        });
      }

      // Verify session belongs to user
      const [targetSession] = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.id, input.sessionId),
            eq(session.userId, ctx.user.id)
          )
        );

      if (!targetSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found",
        });
      }

      await db.delete(session).where(eq(session.id, input.sessionId));

      return { success: true };
    }),

  // Revoke all other sessions
  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .delete(session)
      .where(
        and(
          eq(session.userId, ctx.user.id),
          // Keep current session
          ctx.session?.id
            ? eq(session.id, ctx.session.id) === false
              ? undefined
              : undefined
            : undefined
        )
      );

    // Actually delete all sessions except current
    if (ctx.session?.id) {
      const allSessions = await db
        .select({ id: session.id })
        .from(session)
        .where(eq(session.userId, ctx.user.id));

      for (const s of allSessions) {
        if (s.id !== ctx.session.id) {
          await db.delete(session).where(eq(session.id, s.id));
        }
      }
    }

    return { success: true };
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

      // Check if user owns any organizations (using database query)
      const memberships = await db
        .select({
          organization,
          role: organizationMember.role,
        })
        .from(organizationMember)
        .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
        .where(eq(organizationMember.userId, ctx.user.id));

      const userOrgs = memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      }));
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

