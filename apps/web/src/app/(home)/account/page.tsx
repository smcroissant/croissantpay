import { headers } from "next/headers";
import Link from "next/link";
import { User, ArrowLeft, Key, Shield, Smartphone } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountDangerZone } from "./account-danger-zone";

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="space-y-6 max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal account settings
          </p>
        </div>

        {/* Profile Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">
                Your personal information
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={session.user.name || ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={session.user.email || ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              To change your profile information, please contact support.
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">
                Manage your account security
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Change your account password
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  disabled
                >
                  Change Password
                </button>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Documentation</h2>
              <p className="text-sm text-muted-foreground">
                Resources and guides
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
          </div>
        </div>

        {/* Danger Zone */}
        <AccountDangerZone userEmail={session.user.email || ""} />
      </div>
    </div>
  );
}



