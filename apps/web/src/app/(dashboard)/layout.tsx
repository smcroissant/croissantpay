import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Smartphone } from "lucide-react";
import { OrganizationSelector } from "@/components/organization-selector";
import { getUserOrganizations, createOrganization } from "@/lib/services/organizations";
import { DashboardNav } from "@/components/dashboard-nav";
import { PendingInvitations } from "@/components/pending-invitations";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">CroissantPay</span>
          </Link>
        </div>

        {/* Navigation - client component to read orgId from URL */}
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <OrganizationSelector />
          </div>
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <UserMenu 
              user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }}
              orgId={organizations[0]?.id}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <PendingInvitations />
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
}

