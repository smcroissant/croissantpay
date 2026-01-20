import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { canAddTeamMember } from "@/lib/api/plan-limits";
import { createBillingPortalSession } from "@/lib/services/stripe";
import { isCloudMode, PLANS, getPlanById } from "@/lib/config";
import { getPlanLimitsContext, getUsageWarnings } from "@/lib/api/plan-limits";
import { db } from "@/lib/db";
import { organization, organizationMember, organizationInvitation, user } from "@/lib/db/schema";
import { organizationBilling } from "@/lib/db/schema-billing";
import { eq, and, gt, sql } from "drizzle-orm";

export const organizationsRouter = createTRPCRouter({
  // =====================
  // ORGANIZATION CRUD
  // =====================

  // List user's organizations with roles
  list: protectedProcedure.query(async ({ ctx }) => {
    // Query from database to include role information
    const memberships = await db
      .select({
        organization,
        role: organizationMember.role,
      })
      .from(organizationMember)
      .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
      .where(eq(organizationMember.userId, ctx.user.id));

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      createdAt: m.organization.createdAt,
    }));
  }),

  // Get current organization
  current: protectedProcedure.query(async ({ ctx }) => {
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organizationId))
      .limit(1);
    return org || null;
  }),

  // Get organization by ID with role
  get: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a member
      const [membership] = await db
        .select({
          organization,
          role: organizationMember.role,
        })
        .from(organizationMember)
        .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      return { ...membership.organization, role: membership.role };
    }),

  // Create new organization
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const [existing] = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, input.slug))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Organization slug already exists",
        });
      }

      const now = new Date();
      const orgId = crypto.randomUUID();

      // Create organization
      const [newOrg] = await db
        .insert(organization)
        .values({
          id: orgId,
        name: input.name,
        slug: input.slug,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Add user as owner
      await db.insert(organizationMember).values({
        organizationId: orgId,
        userId: ctx.user.id,
        role: "owner",
        createdAt: now,
      });

      return { ...newOrg, role: "owner" };
    }),

  // Update organization
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken by another org
      if (input.slug) {
        const [existing] = await db
          .select()
          .from(organization)
          .where(
            and(
              eq(organization.slug, input.slug),
              // Not the current org
              sql`${organization.id} != ${input.organizationId}`
            )
          )
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Organization slug already exists",
          });
        }
      }

      const updates: Partial<{ name: string; slug: string; updatedAt: Date }> = {
        updatedAt: new Date(),
      };
      if (input.name) updates.name = input.name;
      if (input.slug) updates.slug = input.slug;

      const [updated] = await db
        .update(organization)
        .set(updates)
        .where(eq(organization.id, input.organizationId))
        .returning();

      return updated;
    }),

  // Delete organization
  delete: protectedProcedure
    .input(z.object({ confirmName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get organization to verify name
      const [org] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, ctx.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      if (input.confirmName !== org.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization name confirmation does not match",
        });
      }

      // Delete organization (cascade deletes members, invitations, etc.)
      await db.delete(organization).where(eq(organization.id, ctx.organizationId));

      return { success: true };
    }),

  // =====================
  // TEAM MANAGEMENT
  // =====================

  // List team members
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const members = await db
      .select({
        member: organizationMember,
        user: user,
      })
      .from(organizationMember)
      .innerJoin(user, eq(organizationMember.userId, user.id))
      .where(eq(organizationMember.organizationId, ctx.organizationId));

    return members.map((m) => ({
      id: m.user.id,
      memberId: m.member.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.member.role,
    }));
  }),

  // List pending invitations
  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await db
      .select()
      .from(organizationInvitation)
      .where(
        and(
          eq(organizationInvitation.organizationId, ctx.organizationId),
          eq(organizationInvitation.status, "pending"),
          gt(organizationInvitation.expiresAt, new Date())
        )
      );

    return invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    }));
  }),

  // Get user's pending invitations
  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.email) return [];

    const invitations = await db
      .select({
        invitation: organizationInvitation,
        organization: organization,
      })
      .from(organizationInvitation)
      .innerJoin(organization, eq(organizationInvitation.organizationId, organization.id))
      .where(
        and(
          eq(organizationInvitation.email, ctx.user.email.toLowerCase()),
          eq(organizationInvitation.status, "pending"),
          gt(organizationInvitation.expiresAt, new Date())
        )
      );

    return invitations.map((i) => ({
      id: i.invitation.id,
      token: i.invitation.token, // Include token for URL-based acceptance
      role: i.invitation.role,
      organizationName: i.organization.name,
      organizationSlug: i.organization.slug,
      expiresAt: i.invitation.expiresAt,
    }));
  }),

  // Invite a user (using database + Better Auth email)
  inviteMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits
      const canInvite = await canAddTeamMember(ctx.organizationId);
      if (!canInvite.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: canInvite.error?.message || "Team member limit reached. Please upgrade your plan.",
        });
      }

      // Create invitation directly in database
      const invitationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(organizationInvitation).values({
        id: invitationId,
        organizationId: ctx.organizationId,
        email: input.email.toLowerCase(),
        role: input.role,
        status: "pending",
        token: crypto.randomUUID(),
        invitedBy: ctx.user.id,
        expiresAt,
      });

      return {
        success: true,
        message: `Invitation sent to ${input.email}`,
      };
    }),

  // Accept an invitation by ID or token
  acceptInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().optional(), token: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Find invitation by ID or token
      let invitation;
      if (input.invitationId) {
        [invitation] = await db
          .select()
          .from(organizationInvitation)
          .where(eq(organizationInvitation.id, input.invitationId))
          .limit(1);
      } else if (input.token) {
        [invitation] = await db
          .select()
          .from(organizationInvitation)
          .where(eq(organizationInvitation.token, input.token))
          .limit(1);
      }

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation is no longer valid" });
      }

      if (new Date(invitation.expiresAt) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });
      }

      // Check if user is already a member
      const [existing] = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, invitation.organizationId),
            eq(organizationMember.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing) {
        // Add user as member
        await db.insert(organizationMember).values({
          organizationId: invitation.organizationId,
          userId: ctx.user.id,
          role: invitation.role,
          createdAt: new Date(),
        });
      }

      // Mark invitation as accepted
      await db
        .update(organizationInvitation)
        .set({ status: "accepted" })
        .where(eq(organizationInvitation.id, invitation.id));

      return { success: true };
    }),

  // Reject an invitation
  rejectInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(organizationInvitation)
        .set({ status: "rejected" })
        .where(eq(organizationInvitation.id, input.invitationId));

      return { success: true };
    }),

  // Cancel an invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(organizationInvitation)
        .set({ status: "canceled" })
        .where(
          and(
            eq(organizationInvitation.id, input.invitationId),
            eq(organizationInvitation.organizationId, ctx.organizationId)
          )
        );

      return { success: true };
    }),

  // Remove a member (using database)
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete member from database
      await db
        .delete(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, ctx.organizationId),
            eq(organizationMember.id, input.memberId)
          )
        );

      return { success: true };
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(organizationMember)
        .set({ role: input.role })
        .where(
          and(
            eq(organizationMember.id, input.memberId),
            eq(organizationMember.organizationId, ctx.organizationId)
          )
        );

      return { success: true };
    }),

  // Leave organization (using database)
  leaveOrganization: protectedProcedure.mutation(async ({ ctx }) => {
    // Get member record
    const [member] = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, ctx.organizationId),
          eq(organizationMember.userId, ctx.user.id)
        )
      )
      .limit(1);

    if (!member) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Not a member of this organization" });
    }

    if (member.role === "owner") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Owners cannot leave the organization. Transfer ownership first or delete the organization.",
      });
    }

    // Delete member from database
    await db
      .delete(organizationMember)
      .where(eq(organizationMember.id, member.id));

    return { success: true };
  }),

  // Set active organization (handled client-side via cookie)
  setActive: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is a member of the organization
      const [member] = await db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Client sets the cookie, server just validates
      return { success: true };
    }),

  // =====================
  // BILLING (Cloud Mode Only)
  // =====================

  getBilling: protectedProcedure.query(async ({ ctx }) => {
    if (!isCloudMode()) {
      return {
        isCloudMode: false,
        plan: null,
        subscription: null,
        plans: [],
      };
    }

    const [billing] = await db
      .select()
      .from(organizationBilling)
      .where(eq(organizationBilling.organizationId, ctx.organizationId))
      .limit(1);

    const subscription = billing
      ? {
          planId: billing.planId,
          status: billing.status,
          billingCycle: billing.billingCycle,
          currentPeriodEnd: billing.currentPeriodEnd,
          cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
        }
      : null;

    const currentPlan = subscription ? getPlanById(subscription.planId) : getPlanById("free");

    return {
      isCloudMode: true,
      plan: currentPlan,
      subscription,
      plans: PLANS,
    };
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const context = await getPlanLimitsContext(ctx.organizationId);
    
    if (!context) {
      return {
        usage: { apps: 0, subscribers: 0, apiRequests: 0, teamMembers: 0 },
        limits: { maxApps: -1, maxSubscribers: -1, maxApiRequests: -1, teamMembers: -1 },
        percentages: { apps: 0, subscribers: 0, apiRequests: 0, teamMembers: 0 },
        warnings: [],
      };
    }

    const warnings = await getUsageWarnings(ctx.organizationId);

    const getPercentage = (current: number, limit: number) => {
      if (limit === -1) return 0;
      return Math.min(100, Math.round((current / limit) * 100));
    };

    return {
      usage: context.usage,
      limits: {
        maxApps: context.features.maxApps,
        maxSubscribers: context.features.maxSubscribers,
        maxApiRequests: context.features.maxApiRequests,
        teamMembers: context.features.teamMembers,
      },
      percentages: {
        apps: getPercentage(context.usage.apps, context.features.maxApps),
        subscribers: getPercentage(context.usage.subscribers, context.features.maxSubscribers),
        apiRequests: getPercentage(context.usage.apiRequests, context.features.maxApiRequests),
        teamMembers: getPercentage(context.usage.teamMembers, context.features.teamMembers),
      },
      warnings,
    };
  }),

  validateBillingAccess: protectedProcedure.query(async ({ ctx }) => {
      if (!isCloudMode()) {
      return { allowed: false, reason: "Billing only available in cloud mode" };
    }

    // Check if user is owner
    const [member] = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, ctx.organizationId),
          eq(organizationMember.userId, ctx.user.id),
          eq(organizationMember.role, "owner")
        )
      )
      .limit(1);

    if (!member) {
      return { allowed: false, reason: "Only organization owners can manage billing" };
    }

    return { allowed: true };
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isCloudMode()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Billing portal only available in cloud mode",
      });
    }

    const [billing] = await db
      .select()
      .from(organizationBilling)
      .where(eq(organizationBilling.organizationId, ctx.organizationId))
      .limit(1);

    if (!billing?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No billing record found. Please upgrade to a paid plan first.",
      });
    }

    const url = await createBillingPortalSession(
      billing.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${ctx.organizationId}/settings`
    );

    return { url };
  }),

  // =====================
  // ONBOARDING (custom fields)
  // =====================

  getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organizationId))
      .limit(1);

    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    }

      return { 
      completed: org.onboardingCompleted,
      step: org.onboardingStep,
      };
    }),

  updateOnboardingProgress: protectedProcedure
    .input(z.object({ step: z.number().min(0).max(7) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(organization)
        .set({ onboardingStep: input.step, updatedAt: new Date() })
        .where(eq(organization.id, ctx.organizationId));

      return { success: true };
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(organization)
      .set({ onboardingCompleted: true, onboardingStep: 7, updatedAt: new Date() })
      .where(eq(organization.id, ctx.organizationId));

    return { success: true };
  }),

  restartOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(organization)
      .set({ onboardingCompleted: false, onboardingStep: 0, updatedAt: new Date() })
      .where(eq(organization.id, ctx.organizationId));

      return { success: true };
    }),
});
