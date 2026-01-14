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
  Upload,
  FileKey,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  RefreshCw,
  X,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bundleId: null as string | null,
    packageName: null as string | null,
    appleTeamId: null as string | null,
    appleKeyId: null as string | null,
    appleIssuerId: null as string | null,
    appleVendorNumber: null as string | null,
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
        appleVendorNumber: app.appleVendorNumber,
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

  // Delete mutation
  const deleteApp = trpc.apps.delete.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/apps`);
    },
  });

  const handleSave = () => {
    updateApp.mutate({
      appId,
      ...formData,
    });
  };

  const handleDelete = () => {
    deleteApp.mutate({ appId });
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
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
            appId={appId}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Delete App?</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{app?.name}</span>?
            </p>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <p className="text-sm text-red-400">
                This will permanently delete the app and all associated data including:
              </p>
              <ul className="text-sm text-red-400 mt-2 list-disc list-inside">
                <li>All products and entitlements</li>
                <li>All subscribers and subscriptions</li>
                <li>All API keys and webhooks</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteApp.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {deleteApp.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Delete App"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
  appleVendorNumber: string | null;
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
  appId,
  formData,
  setFormData,
  showSecrets,
  setShowSecrets,
}: {
  appId: string;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  showSecrets: Record<string, boolean>;
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSharedSecret, setShowSharedSecret] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const hasAppleConfig = formData.applePrivateKey && formData.appleKeyId && formData.appleIssuerId;

  // Test connection mutation
  const testConnection = trpc.products.testAppStoreConnection.useMutation({
    onSuccess: (result) => {
      if (result.appFound) {
        setTestResult({
          type: "success",
          message: result.message,
        });
      } else {
        setTestResult({
          type: "warning",
          message: result.message,
        });
      }
    },
    onError: (error) => {
      setTestResult({
        type: "error",
        message: error.message,
      });
    },
  });

  // Extract Key ID from p8 filename (format: AuthKey_XXXXXXXXXX.p8 or SubscriptionKey_XXXXXXXXXX.p8)
  const extractKeyIdFromFilename = (filename: string): string | null => {
    const match = filename.match(/(?:AuthKey|SubscriptionKey)_([A-Z0-9]+)\.p8$/i);
    return match ? match[1] : null;
  };

  // Handle P8 file drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    processP8File(file);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    processP8File(file);
  };

  // Process P8 file
  const processP8File = (file: File) => {
    if (!file.name.endsWith('.p8')) {
      setUploadError('Please upload a .p8 key file from App Store Connect');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Validate it looks like a private key
      if (!content.includes('-----BEGIN PRIVATE KEY-----') || !content.includes('-----END PRIVATE KEY-----')) {
        setUploadError('Invalid .p8 file. The file should contain a private key.');
        return;
      }

      // Extract Key ID from filename
      const extractedKeyId = extractKeyIdFromFilename(file.name);

      setFormData((prev) => ({
        ...prev,
        applePrivateKey: content.trim(),
        ...(extractedKeyId && !prev.appleKeyId ? { appleKeyId: extractedKeyId } : {}),
      }));
    };
    reader.onerror = () => setUploadError('Failed to read file');
    reader.readAsText(file);
  };

  // Clear Apple credentials
  const clearAppleCredentials = () => {
    setFormData((prev) => ({
      ...prev,
      applePrivateKey: null,
      appleKeyId: null,
      appleIssuerId: null,
      appleVendorNumber: null,
      appleTeamId: null,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">App Store Connect API</h2>
          <p className="text-sm text-muted-foreground">
            An App Store Connect API key is required to import products, have product price changes automatically applied, and more.
          </p>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            testResult.type === "success"
              ? "bg-green-500/10 border border-green-500/20"
              : testResult.type === "warning"
              ? "bg-yellow-500/10 border border-yellow-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          {testResult.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          ) : testResult.type === "warning" ? (
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm whitespace-pre-wrap ${
                testResult.type === "success"
                  ? "text-green-400"
                  : testResult.type === "warning"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {testResult.message}
            </p>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="p-1 hover:bg-background rounded shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Configuration Status */}
      {hasAppleConfig ? (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-400">App Store Connect configured</p>
                <p className="text-sm text-muted-foreground">
                  Key ID: <span className="font-mono">{formData.appleKeyId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTestResult(null);
                  testConnection.mutate({ appId });
                }}
                disabled={testConnection.isPending || !formData.bundleId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                {testConnection.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test Connection
              </button>
              <button
                onClick={clearAppleCredentials}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
          {!formData.bundleId && (
            <p className="text-xs text-yellow-400 mt-3">
              ⚠️ Bundle ID is required in the General tab to test the connection and sync products.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* P8 File Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">P8 key file from App Store Connect</label>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-primary mb-1">
                Drop a file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                File name format should follow <span className="font-mono">AuthKey_XXXXXXXXXX.p8</span>
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
                <FileKey className="w-4 h-4" />
                <span>Select File</span>
                <input
                  type="file"
                  accept=".p8"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}
          </div>
        </>
      )}

      {/* Key ID & Issuer ID (shown after upload or if editing) */}
      {(formData.applePrivateKey || formData.appleKeyId || formData.appleIssuerId) && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Key ID</label>
              <span className="text-xs text-muted-foreground">
                {formData.applePrivateKey && !formData.appleKeyId ? "Required after uploading the p8 key" : ""}
              </span>
            </div>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Issuer ID</label>
              <span className="text-xs text-muted-foreground">
                {formData.applePrivateKey && !formData.appleIssuerId ? "Required after uploading the p8 key" : ""}
              </span>
            </div>
            <input
              type="text"
              value={formData.appleIssuerId || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  appleIssuerId: e.target.value || null,
                }))
              }
              placeholder="57246542-96fe-1a63-e053-0824d0110xxx"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in App Store Connect → Users and Access → Integrations → App Store Connect API
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vendor Number</label>
            <input
              type="text"
              value={formData.appleVendorNumber || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  appleVendorNumber: e.target.value || null,
                }))
              }
              placeholder="88888888"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Found in App Store Connect → Payments and Financial Reports (top left corner)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Team ID (Optional)</label>
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
        </div>
      )}

      {/* Collapsible: Shared Secret (Legacy) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSharedSecret(!showSharedSecret)}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <span className="font-medium">App-specific shared secret (Legacy)</span>
          {showSharedSecret ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showSharedSecret && (
          <div className="p-4 border-t border-border bg-secondary/30">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-400 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  The shared secret is only needed for legacy receipt validation. 
                  For new apps using StoreKit 2, the P8 key above is sufficient.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Shared Secret</label>
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
                  placeholder="Your 32-character shared secret"
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
              <p className="text-xs text-muted-foreground mt-1">
                Found in App Store Connect → Your App → General → App Information → App-Specific Shared Secret
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-400 mb-2">How to get your API key</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Go to <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">App Store Connect → Users and Access → Integrations → App Store Connect API</a>
                </li>
                <li>
                  Click the <span className="text-foreground font-medium">&quot;+&quot;</span> button to generate a new key
                </li>
                <li>
                  Give it a name (e.g., &quot;CroissantPay&quot;) and select <span className="text-foreground font-medium">App Manager</span> access
                </li>
                <li>
                  Download the .p8 private key file <span className="text-yellow-400">(you can only download it once!)</span>
                </li>
                <li>
                  Note the <span className="text-foreground font-medium">Issuer ID</span> shown at the top of the Keys page (UUID format)
                </li>
                <li>
                  Note the <span className="text-foreground font-medium">Key ID</span> shown in the keys table (10-character alphanumeric)
                </li>
                <li>
                  Upload the .p8 file above, then enter the Key ID and Issuer ID
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <p className="font-medium mb-2">Troubleshooting</p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span><span className="text-foreground">JWT token error:</span> Double-check that your Key ID and Issuer ID are correct. The Key ID should be exactly 10 characters.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span><span className="text-foreground">App not found:</span> Make sure the Bundle ID in the General tab matches exactly with your app in App Store Connect.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span><span className="text-foreground">Permission denied:</span> Ensure your API key has at least &quot;App Manager&quot; access level.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span><span className="text-foreground">No products found:</span> Products must be created in App Store Connect first before they can be synced.</span>
            </li>
          </ul>
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasGoogleConfig = formData.googleServiceAccount;
  
  // Parse service account email from JSON if available
  const serviceAccountEmail = (() => {
    if (!formData.googleServiceAccount) return null;
    try {
      const parsed = JSON.parse(formData.googleServiceAccount);
      return parsed.client_email;
    } catch {
      return null;
    }
  })();

  // Handle JSON file drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    processJsonFile(file);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    processJsonFile(file);
  };

  // Process JSON file
  const processJsonFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setUploadError('Please upload a .json service account key file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      try {
        const parsed = JSON.parse(content);
        
        // Validate it looks like a service account
        if (parsed.type !== 'service_account') {
          setUploadError('Invalid service account file. The file should have type "service_account".');
          return;
        }

        if (!parsed.client_email || !parsed.private_key) {
          setUploadError('Invalid service account file. Missing required fields.');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          googleServiceAccount: content.trim(),
        }));
      } catch {
        setUploadError('Invalid JSON file. Please upload a valid service account key.');
      }
    };
    reader.onerror = () => setUploadError('Failed to read file');
    reader.readAsText(file);
  };

  // Clear Google credentials
  const clearGoogleCredentials = () => {
    setFormData((prev) => ({
      ...prev,
      googleServiceAccount: null,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Google Play Console</h2>
        <p className="text-sm text-muted-foreground">
          A service account is required to validate purchases and import products from Google Play.
        </p>
      </div>

      {/* Configuration Status */}
      {hasGoogleConfig ? (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-green-400">Service Account configured</p>
                {serviceAccountEmail && (
                  <p className="text-sm text-muted-foreground font-mono truncate max-w-md">
                    {serviceAccountEmail}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={clearGoogleCredentials}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* JSON File Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Service Account JSON key</label>
              <span className="text-xs text-muted-foreground">Required</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-primary mb-1">
                Drop a file here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Upload your Google Cloud service account JSON key file
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
                <FileKey className="w-4 h-4" />
                <span>Select File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}
          </div>
        </>
      )}

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <p className="font-medium text-green-400 mb-2">How to get your service account</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to <span className="text-foreground">Google Cloud Console → IAM & Admin → Service Accounts</span></li>
              <li>Create a new service account (or use existing)</li>
              <li>Create a JSON key for the service account and download it</li>
              <li>In <span className="text-foreground">Google Play Console → Settings → API access</span>, link the service account</li>
              <li>Grant the service account &quot;View financial data&quot; and &quot;Manage orders&quot; permissions</li>
            </ol>
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

