import { redirect, notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organization, organizationMember } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Organization-scoped dashboard layout
 * Validates that the user has access to the organization in the URL
 */
export default async function OrgDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
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

  const organizations = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  // Verify user has access to this organization
  const currentOrg = organizations.find((o) => o.id === orgId);
  
  if (!currentOrg) {
    notFound();
  }

  // Set the selected org cookie to sync with the URL
  // If cookie doesn't match URL, we'll let the client component sync it
  // This is handled by the OrganizationSelector

  return <>{children}</>;
}

