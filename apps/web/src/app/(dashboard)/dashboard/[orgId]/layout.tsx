import { redirect, notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserOrganizations } from "@/lib/services/organizations";

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

  // Get user's organizations
  const organizations = await getUserOrganizations(session.user.id);

  // Verify user has access to this organization
  const currentOrg = organizations.find((o) => o.id === orgId);
  
  if (!currentOrg) {
    notFound();
  }

  // Set the selected org cookie to sync with the URL
  const cookieStore = await cookies();
  const currentSelectedOrgId = cookieStore.get("selectedOrgId")?.value;
  
  // If cookie doesn't match URL, we'll let the client component sync it
  // This is handled by the OrganizationSelector

  return <>{children}</>;
}

