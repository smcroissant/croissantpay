import { headers } from "next/headers";
import Link from "next/link";
import { User, Key, ArrowRight, BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organization, organizationMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { BillingSettings } from "./billing-settings";
import { TeamSettings } from "./team-settings";
import { OrgDangerZone } from "./org-danger-zone";
import { OrganizationSettings } from "./organization-settings";
import { RestartOnboardingButton } from "./restart-onboarding-button";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Get organization details
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1);

  // Get user role in this organization
  let isOwner = false;
  if (session) {
    const [membership] = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, orgId),
          eq(organizationMember.userId, session.user.id)
        )
      )
      .limit(1);
    isOwner = membership?.role === "owner";
  }

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

      {/* Setup Guide */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Setup Guide</h2>
              <p className="text-sm text-muted-foreground">
                Step-by-step guide to configure your app
              </p>
            </div>
          </div>
          <RestartOnboardingButton orgId={orgId} />
        </div>

        <Link
          href={`/dashboard/${orgId}/onboarding`}
          className="block p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
        >
          <h3 className="font-medium mb-1">View Setup Guide</h3>
          <p className="text-sm text-muted-foreground">
            Review the setup steps for Apple, Google, products, webhooks, and SDK integration
          </p>
        </Link>
      </div>

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
            <h3 className="font-medium mb-1">Self-Hosting (coming soon)</h3>
            <p className="text-sm text-muted-foreground">
              Self-hosting coming soon. Deploy on your own infrastructure
            </p>
          </Link>
        </div>
      </div>

      {/* Organization Danger Zone */}
      <OrgDangerZone orgId={orgId} orgName={org?.name || ""} isOwner={isOwner} />
    </div>
  );
}

