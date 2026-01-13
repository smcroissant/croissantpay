"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Apple,
  Play,
  Webhook,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type Tab = "general" | "apple" | "google" | "webhook";

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "general";

  const orgId = params.orgId as string;
  const appId = params.appId as string;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bundleId: null as string | null,
    packageName: null as string | null,
    appleTeamId: null as string | null,
    appleKeyId: null as string | null,
    appleIssuerId: null as string | null,
    applePrivateKey: null as string | null,
    appleSharedSecret: null as string | null,
    googleServiceAccount: null as string | null,
    webhookUrl: null as string | null,
  });

  const [showSecrets, setShowSecrets] = useState({
    applePrivateKey: false,
    appleSharedSecret: false,
    googleServiceAccount: false,
  });

  // Fetch app data
  const { data: app, isLoading } = trpc.apps.get.useQuery(
    { appId },
    { enabled: !!appId }
  );

  // Update form when app data loads
  useEffect(() => {
    if (app) {
      setFormData({
        name: app.name,
        bundleId: app.bundleId,
        packageName: app.packageName,
        appleTeamId: app.appleTeamId,
        appleKeyId: app.appleKeyId,
        appleIssuerId: app.appleIssuerId,
        applePrivateKey: app.applePrivateKey,
        appleSharedSecret: app.appleSharedSecret,
        googleServiceAccount: app.googleServiceAccount,
        webhookUrl: app.webhookUrl,
      });
    }
  }, [app]);

  // Update mutation
  const updateApp = trpc.apps.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSave = () => {
    updateApp.mutate({
      appId,
      ...formData,
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "apple", label: "App Store", icon: <Apple className="w-4 h-4" /> },
    { id: "google", label: "Play Store", icon: <Play className="w-4 h-4" /> },
    { id: "webhook", label: "Webhook", icon: <Webhook className="w-4 h-4" /> },
  ];

  if (isLoading || !appId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${orgId}/apps/${appId}`}
            className="p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit {formData.name}</h1>
            <p className="text-muted-foreground">Configure your app settings</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={updateApp.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {updateApp.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Error */}
      {updateApp.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updateApp.error.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {activeTab === "general" && (
          <GeneralTab formData={formData} setFormData={setFormData} />
        )}
        {activeTab === "apple" && (
          <AppleTab
            formData={formData}
            setFormData={setFormData}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
          />
        )}
        {activeTab === "google" && (
          <GoogleTab
            formData={formData}
            setFormData={setFormData}
            showSecrets={showSecrets}
            setShowSecrets={setShowSecrets}
          />
        )}
        {activeTab === "webhook" && (
          <WebhookTab formData={formData} setFormData={setFormData} />
        )}
      </div>
    </div>
  );
}

interface FormData {
  name: string;
  bundleId: string | null;
  packageName: string | null;
  appleTeamId: string | null;
  appleKeyId: string | null;
  appleIssuerId: string | null;
  applePrivateKey: string | null;
  appleSharedSecret: string | null;
  googleServiceAccount: string | null;
  webhookUrl: string | null;
}

function GeneralTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">General Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Basic information about your app
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">App Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            iOS Bundle ID
          </label>
          <input
            type="text"
            value={formData.bundleId || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                bundleId: e.target.value || null,
              }))
            }
            placeholder="com.example.myapp"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Android Package Name
          </label>
          <input
            type="text"
            value={formData.packageName || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                packageName: e.target.value || null,
              }))
            }
            placeholder="com.example.myapp"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function AppleTab({
  formData,
  setFormData,
  showSecrets,
  setShowSecrets,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showSecrets: Record<string, boolean>;
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">App Store Connect</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your Apple App Store Connect credentials
        </p>
      </div>

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
        <p className="font-medium text-blue-400 mb-2">How to get credentials:</p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
          <li>Go to App Store Connect → Users and Access → Keys</li>
          <li>Generate an In-App Purchase API Key</li>
          <li>Download the .p8 private key file</li>
          <li>Copy the Key ID and Issuer ID</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Team ID</label>
          <input
            type="text"
            value={formData.appleTeamId || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                appleTeamId: e.target.value || null,
              }))
            }
            placeholder="ABCDE12345"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key ID</label>
          <input
            type="text"
            value={formData.appleKeyId || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                appleKeyId: e.target.value || null,
              }))
            }
            placeholder="ABC123DEFG"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Issuer ID</label>
          <input
            type="text"
            value={formData.appleIssuerId || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                appleIssuerId: e.target.value || null,
              }))
            }
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Private Key (.p8)</label>
          <div className="relative">
            <textarea
              value={formData.applePrivateKey || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  applePrivateKey: e.target.value || null,
                }))
              }
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              rows={6}
              className={`w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm ${
                !showSecrets.applePrivateKey && formData.applePrivateKey
                  ? "text-transparent select-none"
                  : ""
              }`}
              style={
                !showSecrets.applePrivateKey && formData.applePrivateKey
                  ? { textShadow: "0 0 8px currentColor" }
                  : {}
              }
            />
            <button
              type="button"
              onClick={() =>
                setShowSecrets((prev) => ({
                  ...prev,
                  applePrivateKey: !prev.applePrivateKey,
                }))
              }
              className="absolute top-3 right-3 p-2 rounded-lg bg-background hover:bg-secondary transition-colors"
            >
              {showSecrets.applePrivateKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Shared Secret (Optional)</label>
          <div className="relative">
            <input
              type={showSecrets.appleSharedSecret ? "text" : "password"}
              value={formData.appleSharedSecret || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  appleSharedSecret: e.target.value || null,
                }))
              }
              placeholder="Your shared secret for legacy receipts"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() =>
                setShowSecrets((prev) => ({
                  ...prev,
                  appleSharedSecret: !prev.appleSharedSecret,
                }))
              }
              className="absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-lg hover:bg-background transition-colors"
            >
              {showSecrets.appleSharedSecret ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleTab({
  formData,
  setFormData,
  showSecrets,
  setShowSecrets,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showSecrets: Record<string, boolean>;
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Google Play Console</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your Google Play Console credentials
        </p>
      </div>

      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
        <p className="font-medium text-green-400 mb-2">How to get credentials:</p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
          <li>Go to Google Cloud Console → IAM & Admin → Service Accounts</li>
          <li>Create a new service account</li>
          <li>Grant it the &quot;Android Publisher&quot; role</li>
          <li>Create a JSON key and download it</li>
          <li>Link the service account in Google Play Console</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Service Account JSON</label>
          <div className="relative">
            <textarea
              value={formData.googleServiceAccount || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  googleServiceAccount: e.target.value || null,
                }))
              }
              placeholder='{"type": "service_account", ...}'
              rows={8}
              className={`w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm ${
                !showSecrets.googleServiceAccount && formData.googleServiceAccount
                  ? "text-transparent select-none"
                  : ""
              }`}
              style={
                !showSecrets.googleServiceAccount && formData.googleServiceAccount
                  ? { textShadow: "0 0 8px currentColor" }
                  : {}
              }
            />
            <button
              type="button"
              onClick={() =>
                setShowSecrets((prev) => ({
                  ...prev,
                  googleServiceAccount: !prev.googleServiceAccount,
                }))
              }
              className="absolute top-3 right-3 p-2 rounded-lg bg-background hover:bg-secondary transition-colors"
            >
              {showSecrets.googleServiceAccount ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookTab({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Webhook Configuration</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure a webhook URL to receive real-time events
        </p>
      </div>

      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm">
        <p className="font-medium text-purple-400 mb-2">Available events:</p>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <span>• subscription.created</span>
          <span>• subscription.renewed</span>
          <span>• subscription.cancelled</span>
          <span>• subscription.expired</span>
          <span>• purchase.completed</span>
          <span>• refund.issued</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Webhook URL</label>
          <input
            type="url"
            value={formData.webhookUrl || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                webhookUrl: e.target.value || null,
              }))
            }
            placeholder="https://your-server.com/api/webhooks/croissantpay"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-secondary">
        <p className="text-sm font-medium mb-2">Webhook Signature</p>
        <p className="text-xs text-muted-foreground">
          All webhooks are signed with HMAC-SHA256. Verify the{" "}
          <code className="bg-background px-1 py-0.5 rounded">X-CroissantPay-Signature</code>{" "}
          header against your webhook secret.
        </p>
      </div>
    </div>
  );
}

