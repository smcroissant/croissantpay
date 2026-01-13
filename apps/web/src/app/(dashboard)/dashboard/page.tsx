import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserOrganizations, createOrganization } from "@/lib/services/organizations";

/**
 * Dashboard root page - redirects to the user's selected or default organization
 */
export default async function DashboardRedirectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Get user's organizations
  let organizations = await getUserOrganizations(session.user.id);

  // Auto-create default organization if none exists
  if (organizations.length === 0) {
    const userSlug =
      session.user.email?.split("@")[0] ||
      `user-${session.user.id.slice(0, 8)}`;
    const newOrg = await createOrganization({
      name: `${session.user.name || userSlug}'s Organization`,
      slug: userSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      ownerId: session.user.id,
    });
    organizations = [{ ...newOrg, role: "owner" }];
  }

  // Get selected organization from cookies, or use first one
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("selectedOrgId")?.value;
  const targetOrgId =
    organizations.find((o) => o.id === selectedOrgId)?.id || organizations[0]?.id;

  // Redirect to the organization-scoped dashboard
  redirect(`/dashboard/${targetOrgId}`);
}
