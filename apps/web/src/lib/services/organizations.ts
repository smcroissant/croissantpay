import { db } from "@/lib/db";
import { organization, organizationMember, organizationInvitation, user } from "@/lib/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import crypto from "crypto";

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: string;
}

export async function getOrganization(
  orgId: string
): Promise<typeof organization.$inferSelect | null> {
  const [found] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  return found || null;
}

export async function getOrganizationBySlug(
  slug: string
): Promise<typeof organization.$inferSelect | null> {
  const [found] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  return found || null;
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  const maxAttempts = 10;

  while (attempt < maxAttempts) {
    const existing = await getOrganizationBySlug(slug);
    if (!existing) {
      return slug;
    }
    // Add random suffix to make it unique
    const suffix = crypto.randomBytes(3).toString("hex");
    slug = `${baseSlug}-${suffix}`;
    attempt++;
  }

  // Fallback: use timestamp + random
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<typeof organization.$inferSelect> {
  // Generate unique slug
  const uniqueSlug = await generateUniqueSlug(input.slug);

  // Create organization
  const [newOrg] = await db
    .insert(organization)
    .values({
      name: input.name,
      slug: uniqueSlug,
    })
    .returning();

  // Add owner as member
  await db.insert(organizationMember).values({
    organizationId: newOrg.id,
    userId: input.ownerId,
    role: "owner",
  });

  return newOrg;
}

export async function getUserOrganizations(
  userId: string
): Promise<Array<typeof organization.$inferSelect & { role: string }>> {
  const memberships = await db
    .select({
      organization,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
    .where(eq(organizationMember.userId, userId));

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));
}

export async function updateOrganization(
  orgId: string,
  input: { name?: string; slug?: string }
): Promise<typeof organization.$inferSelect> {
  const [updated] = await db
    .update(organization)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(organization.id, orgId))
    .returning();

  return updated;
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await db.delete(organization).where(eq(organization.id, orgId));
}

// Members
export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: string = "member"
): Promise<void> {
  await db.insert(organizationMember).values({
    organizationId: orgId,
    userId,
    role,
  });
}

export async function removeOrganizationMember(
  orgId: string,
  userId: string
): Promise<void> {
  await db
    .delete(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId)
      )
    );
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: string
): Promise<void> {
  await db
    .update(organizationMember)
    .set({ role })
    .where(
      and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId)
      )
    );
}

export async function getOrganizationMembers(
  orgId: string
): Promise<Array<{ user: typeof user.$inferSelect; role: string }>> {
  const members = await db
    .select({
      user,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .innerJoin(user, eq(organizationMember.userId, user.id))
    .where(eq(organizationMember.organizationId, orgId));

  return members;
}

export async function isOrganizationOwner(
  orgId: string,
  userId: string
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId),
        eq(organizationMember.role, "owner")
      )
    )
    .limit(1);

  return !!member;
}

export async function isOrganizationMember(
  orgId: string,
  userId: string
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(organizationMember)
    .where(
      and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId)
      )
    )
    .limit(1);

  return !!member;
}

// Invitations
export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<typeof organizationInvitation.$inferSelect> {
  // Generate unique token
  const token = crypto.randomBytes(32).toString("hex");
  
  // Expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Check if invitation already exists and is pending
  const [existing] = await db
    .select()
    .from(organizationInvitation)
    .where(
      and(
        eq(organizationInvitation.organizationId, input.organizationId),
        eq(organizationInvitation.email, input.email.toLowerCase()),
        isNull(organizationInvitation.acceptedAt),
        gt(organizationInvitation.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existing) {
    // Update existing invitation
    const [updated] = await db
      .update(organizationInvitation)
      .set({
        role: input.role,
        token,
        invitedBy: input.invitedBy,
        expiresAt,
      })
      .where(eq(organizationInvitation.id, existing.id))
      .returning();
    return updated;
  }

  // Create new invitation
  const [invitation] = await db
    .insert(organizationInvitation)
    .values({
      organizationId: input.organizationId,
      email: input.email.toLowerCase(),
      role: input.role,
      token,
      invitedBy: input.invitedBy,
      expiresAt,
    })
    .returning();

  return invitation;
}

export async function getInvitationByToken(
  token: string
): Promise<(typeof organizationInvitation.$inferSelect & { organization: typeof organization.$inferSelect }) | null> {
  const [result] = await db
    .select({
      invitation: organizationInvitation,
      organization: organization,
    })
    .from(organizationInvitation)
    .innerJoin(organization, eq(organizationInvitation.organizationId, organization.id))
    .where(
      and(
        eq(organizationInvitation.token, token),
        isNull(organizationInvitation.acceptedAt),
        gt(organizationInvitation.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!result) return null;

  return { ...result.invitation, organization: result.organization };
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<boolean> {
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    return false;
  }

  // Check if user is already a member
  const isMember = await isOrganizationMember(invitation.organizationId, userId);
  if (isMember) {
    // Mark invitation as accepted anyway
    await db
      .update(organizationInvitation)
      .set({ acceptedAt: new Date() })
      .where(eq(organizationInvitation.id, invitation.id));
    return true;
  }

  // Add user to organization
  await addOrganizationMember(invitation.organizationId, userId, invitation.role);

  // Mark invitation as accepted
  await db
    .update(organizationInvitation)
    .set({ acceptedAt: new Date() })
    .where(eq(organizationInvitation.id, invitation.id));

  return true;
}

export async function getPendingInvitations(
  organizationId: string
): Promise<Array<typeof organizationInvitation.$inferSelect & { inviter: { name: string | null; email: string } }>> {
  const invitations = await db
    .select({
      invitation: organizationInvitation,
      inviter: {
        name: user.name,
        email: user.email,
      },
    })
    .from(organizationInvitation)
    .innerJoin(user, eq(organizationInvitation.invitedBy, user.id))
    .where(
      and(
        eq(organizationInvitation.organizationId, organizationId),
        isNull(organizationInvitation.acceptedAt),
        gt(organizationInvitation.expiresAt, new Date())
      )
    );

  return invitations.map((i) => ({ ...i.invitation, inviter: i.inviter }));
}

export async function cancelInvitation(
  invitationId: string
): Promise<void> {
  await db.delete(organizationInvitation).where(eq(organizationInvitation.id, invitationId));
}

export async function getInvitationsByEmail(
  email: string
): Promise<Array<typeof organizationInvitation.$inferSelect & { organization: typeof organization.$inferSelect }>> {
  const invitations = await db
    .select({
      invitation: organizationInvitation,
      organization: organization,
    })
    .from(organizationInvitation)
    .innerJoin(organization, eq(organizationInvitation.organizationId, organization.id))
    .where(
      and(
        eq(organizationInvitation.email, email.toLowerCase()),
        isNull(organizationInvitation.acceptedAt),
        gt(organizationInvitation.expiresAt, new Date())
      )
    );

  return invitations.map((i) => ({ ...i.invitation, organization: i.organization }));
}

