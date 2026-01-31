import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateUserOrganizations } from "@/lib/organizations";

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

  const organizations = await getOrCreateUserOrganizations(
    session.user.id,
    session.user.email,
    session.user.name
  );

  // Get selected organization from cookies, or use first one
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get("selectedOrgId")?.value;
  const targetOrgId =
    organizations.find((o) => o.id === selectedOrgId)?.id || organizations[0]?.id;

  // Redirect to the organization-scoped dashboard
  redirect(`/dashboard/${targetOrgId}`);
}
