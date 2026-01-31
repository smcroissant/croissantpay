import { db } from "@/lib/db";
import { organization, organizationMember } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type OrganizationWithRole = typeof organization.$inferSelect & {
  role: string;
};

/**
 * Get the user's organizations, creating a default one if none exist.
 * Uses a user-unique slug to avoid collisions and handles concurrent creation
 * (e.g. layout + page both running) by catching duplicate key and re-querying.
 */
export async function getOrCreateUserOrganizations(
  userId: string,
  userEmail: string | null | undefined,
  userName: string | null | undefined
): Promise<OrganizationWithRole[]> {
  const memberships = await db
    .select({
      organization,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
    .where(eq(organizationMember.userId, userId));

  let organizations: OrganizationWithRole[] = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  if (organizations.length > 0) {
    return organizations;
  }

  const baseSlug =
    userEmail?.split("@")[0] || `user-${userId.slice(0, 8)}`;
  // Include userId in slug so it's globally unique (avoids duplicate key across users and races)
  const slug =
    baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") +
    "-" +
    userId.slice(0, 8);

  const orgId = crypto.randomUUID();
  const now = new Date();

  try {
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: orgId,
        name: `${userName || baseSlug}'s Organization`,
        slug,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(organizationMember).values({
      organizationId: orgId,
      userId,
      role: "owner",
      createdAt: now,
    });

    return [{ ...newOrg, role: "owner" }];
  } catch (err) {
    // Concurrent request may have created the org (e.g. layout + page); re-query
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : null;
    if (code === "23505") {
      const retry = await db
        .select({
          organization,
          role: organizationMember.role,
        })
        .from(organizationMember)
        .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
        .where(eq(organizationMember.userId, userId));
      return retry.map((m) => ({ ...m.organization, role: m.role }));
    }
    throw err;
  }
}
