import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  getUserOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationBySlug,
  getOrganizationMembers,
  removeOrganizationMember,
  updateMemberRole,
  createInvitation,
  getPendingInvitations,
  cancelInvitation,
  acceptInvitation,
  getInvitationsByEmail,
  deleteOrganization,
} from "@/lib/services/organizations";
import { canAddTeamMember } from "@/lib/api/plan-limits";
import {
  getSubscriptionInfo,
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/services/stripe";
import { isCloudMode, PLANS, getPlanById } from "@/lib/config";
import { getPlanLimitsContext, getUsageWarnings } from "@/lib/api/plan-limits";

export const organizationsRouter = createTRPCRouter({
  // List user's organizations
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserOrganizations(ctx.user.id);
  }),

  // Get current organization
  current: protectedProcedure.query(async ({ ctx }) => {
    return getOrganization(ctx.organizationId);
  }),

  // Get organization by ID
  get: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === input.organizationId);
      
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      return org;
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
      const existing = await getOrganizationBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Organization slug already exists",
        });
      }

      return createOrganization({
        name: input.name,
        slug: input.slug,
        ownerId: ctx.user.id,
      });
    }),

  // Update organization
  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access to this organization
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === input.organizationId);
      
      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Only owners can update
      if (org.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can update organization",
        });
      }

      // Check if new slug is already taken
      if (input.slug && input.slug !== org.slug) {
        const existing = await getOrganizationBySlug(input.slug);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Organization slug already exists",
          });
        }
      }

      const { organizationId, ...updates } = input;
      return updateOrganization(organizationId, updates);
    }),

  // =====================
  // BILLING (Cloud Mode Only)
  // =====================

  // Get billing/subscription info
  getBilling: protectedProcedure.query(async ({ ctx }) => {
    if (!isCloudMode()) {
      return {
        isCloudMode: false,
        plan: null,
        subscription: null,
        plans: [],
      };
    }

    const subscription = await getSubscriptionInfo(ctx.organizationId);
    const currentPlan = subscription ? getPlanById(subscription.planId) : getPlanById("free");

    return {
      isCloudMode: true,
      plan: currentPlan,
      subscription,
      plans: PLANS,
    };
  }),

  // Get current usage and limits
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

    // Calculate percentages
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

  // Create checkout session for upgrading
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isCloudMode()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Billing only available in cloud mode",
        });
      }

      // Verify user is owner
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!org || org.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization owners can manage billing",
        });
      }

      const url = await createCheckoutSession({
        organizationId: ctx.organizationId,
        planId: input.planId,
        billingCycle: input.billingCycle,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${ctx.organizationId}/settings?billing=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${ctx.organizationId}/settings?billing=canceled`,
      });

      return { url };
    }),

  // Create billing portal session
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isCloudMode()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Billing portal only available in cloud mode",
      });
    }

    // Verify user is owner
    const orgs = await getUserOrganizations(ctx.user.id);
    const org = orgs.find((o) => o.id === ctx.organizationId);
    
    if (!org || org.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only organization owners can manage billing",
      });
    }

    const url = await createBillingPortalSession(
      ctx.organizationId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${ctx.organizationId}/settings`
    );

    return { url };
  }),

  // =====================
  // TEAM MANAGEMENT
  // =====================

  // List team members
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const members = await getOrganizationMembers(ctx.organizationId);
    return members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
    }));
  }),

  // List pending invitations
  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await getPendingInvitations(ctx.organizationId);
    return invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invitedBy: i.inviter.name || i.inviter.email,
      expiresAt: i.expiresAt,
      createdAt: i.createdAt,
    }));
  }),

  // Get user's pending invitations
  myInvitations: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.email) return [];
    const invitations = await getInvitationsByEmail(ctx.user.email);
    return invitations.map((i) => ({
      id: i.id,
      token: i.token,
      role: i.role,
      organizationName: i.organization.name,
      organizationSlug: i.organization.slug,
      expiresAt: i.expiresAt,
    }));
  }),

  // Invite a user
  inviteMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is owner or admin
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!org || (org.role !== "owner" && org.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can invite members",
        });
      }

      // Check plan limits
      const canInvite = await canAddTeamMember(ctx.organizationId);
      if (!canInvite.allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: canInvite.error?.message || "Team member limit reached. Please upgrade your plan.",
        });
      }

      // Create invitation
      const invitation = await createInvitation({
        organizationId: ctx.organizationId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.user.id,
      });

      // TODO: Send invitation email
      // For now, just return the invitation token (in production, send via email)
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.token}`;

      return { 
        success: true, 
        inviteUrl,
        message: `Invitation sent to ${input.email}`,
      };
    }),

  // Accept an invitation
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const success = await acceptInvitation(input.token, ctx.user.id);
      
      if (!success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired invitation",
        });
      }

      return { success: true };
    }),

  // Cancel an invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is owner or admin
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!org || (org.role !== "owner" && org.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners and admins can cancel invitations",
        });
      }

      await cancelInvitation(input.invitationId);
      return { success: true };
    }),

  // Remove a member
  removeMember: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is owner
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!org || org.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can remove members",
        });
      }

      // Can't remove yourself as owner
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself from the organization",
        });
      }

      await removeOrganizationMember(ctx.organizationId, input.userId);
      return { success: true };
    }),

  // Update member role
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["admin", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is owner
      const orgs = await getUserOrganizations(ctx.user.id);
      const org = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!org || org.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can change member roles",
        });
      }

      // Can't change owner's role
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      await updateMemberRole(ctx.organizationId, input.userId, input.role);
      return { success: true };
    }),

  // Leave organization
  leaveOrganization: protectedProcedure.mutation(async ({ ctx }) => {
    // Verify user is not the owner
    const orgs = await getUserOrganizations(ctx.user.id);
    const org = orgs.find((o) => o.id === ctx.organizationId);
    
    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    if (org.role === "owner") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Owners cannot leave the organization. Transfer ownership first or delete the organization.",
      });
    }

    await removeOrganizationMember(ctx.organizationId, ctx.user.id);
    return { success: true };
  }),

  // Delete organization
  delete: protectedProcedure
    .input(
      z.object({
        confirmName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get organization details
      const org = await getOrganization(ctx.organizationId);
      
      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Verify user is owner
      const orgs = await getUserOrganizations(ctx.user.id);
      const userOrg = orgs.find((o) => o.id === ctx.organizationId);
      
      if (!userOrg || userOrg.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization owners can delete the organization",
        });
      }

      // Verify name confirmation
      if (input.confirmName !== org.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization name confirmation does not match",
        });
      }

      // Delete the organization (cascades to members, apps, etc.)
      await deleteOrganization(ctx.organizationId);

      return { success: true };
    }),
});

