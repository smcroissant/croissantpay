import { headers } from "next/headers";
import Link from "next/link";
import { User, Key, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { BillingSettings } from "./billing-settings";
import { TeamSettings } from "./team-settings";
import { OrgDangerZone } from "./org-danger-zone";
import { getOrganization, getUserOrganizations } from "@/lib/services/organizations";
import { OrganizationSettings } from "./organization-settings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Get organization details and user role
  const org = await getOrganization(orgId);
  const userOrgs = session ? await getUserOrganizations(session.user.id) : [];
  const userOrg = userOrgs.find((o) => o.id === orgId);
  const isOwner = userOrg?.role === "owner";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">
            Manage settings for {org?.name || "this organization"}
          </p>
        </div>
        <Link
          href="/account"
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Account Settings
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Organization Settings */}
      <OrganizationSettings orgId={orgId} isOwner={isOwner} />

      {/* Team */}
      <TeamSettings orgId={orgId} />

      {/* Billing */}
      <BillingSettings orgId={orgId} />

      {/* API Documentation */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">API & SDKs</h2>
            <p className="text-sm text-muted-foreground">
              Documentation and integration guides
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/docs/getting-started"
            className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <h3 className="font-medium mb-1">Getting Started</h3>
            <p className="text-sm text-muted-foreground">
              Quick start guide for CroissantPay
            </p>
          </Link>
          <Link
            href="/docs/sdk/react-native"
            className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <h3 className="font-medium mb-1">React Native SDK</h3>
            <p className="text-sm text-muted-foreground">
              Integrate with React Native
            </p>
          </Link>
          <Link
            href="/docs/webhooks"
            className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <h3 className="font-medium mb-1">Webhooks</h3>
            <p className="text-sm text-muted-foreground">
              Server-to-server notifications
            </p>
          </Link>
          <Link
            href="/docs/self-hosted"
            className="p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <h3 className="font-medium mb-1">Self-Hosting</h3>
            <p className="text-sm text-muted-foreground">
              Deploy on your own infrastructure
            </p>
          </Link>
        </div>
      </div>

      {/* Organization Danger Zone */}
      <OrgDangerZone orgId={orgId} orgName={org?.name || ""} isOwner={isOwner} />
    </div>
  );
}

