import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organization, organizationMember } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Dashboard root page - redirects to the user's selected or default organization
 */
export default async function DashboardRedirectPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/login");
  }

  // Get user's organizations from database
  const memberships = await db
    .select({
      organization,
      role: organizationMember.role,
    })
    .from(organizationMember)
    .innerJoin(organization, eq(organizationMember.organizationId, organization.id))
    .where(eq(organizationMember.userId, session.user.id));

  let organizations = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  // Auto-create default organization if none exists
  if (organizations.length === 0) {
    const userSlug =
      session.user.email?.split("@")[0] ||
      `user-${session.user.id.slice(0, 8)}`;
    
    const orgId = crypto.randomUUID();
    const now = new Date();
    
    // Insert organization
    const [newOrg] = await db
      .insert(organization)
      .values({
        id: orgId,
        name: `${session.user.name || userSlug}'s Organization`,
        slug: userSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Add user as owner
    await db.insert(organizationMember).values({
      organizationId: orgId,
      userId: session.user.id,
      role: "owner",
      createdAt: now,
    });

    organizations = [{ ...newOrg, role: "owner" as const }];
  }

  // Get selected organization from cookies, or use first one
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("selectedOrgId")?.value;
  const targetOrgId =
    organizations.find((o) => o.id === selectedOrgId)?.id || organizations[0]?.id;

  // Redirect to the organization-scoped dashboard
  redirect(`/dashboard/${targetOrgId}`);
}
