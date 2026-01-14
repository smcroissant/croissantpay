"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Apple,
  Play,
  Check,
  Loader2,
  ExternalLink,
  Upload,
  FileKey,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Basic
  name: string;
  platforms: ("ios" | "android")[];
  // iOS
  bundleId: string;
  appleKeyId: string;
  appleIssuerId: string;
  applePrivateKey: string;
  appleVendorNumber: string;
  // Android
  packageName: string;
  googleServiceAccount: string;
}

export default function NewAppPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    platforms: [],
    bundleId: "",
    appleKeyId: "",
    appleIssuerId: "",
    applePrivateKey: "",
    appleVendorNumber: "",
    packageName: "",
    googleServiceAccount: "",
  });

  // File upload states
  const [isDraggingP8, setIsDraggingP8] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const createApp = trpc.apps.create.useMutation();
  const updateApp = trpc.apps.update.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/apps`);
      router.refresh();
    },
  });

  const togglePlatform = (platform: "ios" | "android") => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  // Calculate which steps to show based on platforms
  const getSteps = () => {
    const steps: { id: Step; label: string }[] = [
      { id: 1, label: "Basic Info" },
      { id: 2, label: "Platforms" },
    ];

    if (formData.platforms.includes("ios")) {
      steps.push({ id: 3, label: "App Store" });
    }
    if (formData.platforms.includes("android")) {
      steps.push({ id: 4, label: "Play Store" });
    }
    steps.push({ id: 5, label: "Review" });

    return steps;
  };

  const getNextStep = (): Step => {
    if (step === 2) {
      if (formData.platforms.includes("ios")) return 3;
      if (formData.platforms.includes("android")) return 4;
      return 5;
    }
    if (step === 3) {
      if (formData.platforms.includes("android")) return 4;
      return 5;
    }
    return (step + 1) as Step;
  };

  const getPrevStep = (): Step => {
    if (step === 4) {
      if (formData.platforms.includes("ios")) return 3;
      return 2;
    }
    if (step === 5) {
      if (formData.platforms.includes("android")) return 4;
      if (formData.platforms.includes("ios")) return 3;
      return 2;
    }
    return (step - 1) as Step;
  };

  // P8 file handling
  const extractKeyIdFromFilename = (filename: string): string | null => {
    const match = filename.match(/(?:AuthKey|SubscriptionKey)_([A-Z0-9]+)\.p8$/i);
    return match ? match[1] : null;
  };

  const handleP8FileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingP8(false);
    setUploadError(null);
    const file = e.dataTransfer.files[0];
    if (file) processP8File(file);
  };

  const handleP8FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      processP8File(file);
    }
  };

  const processP8File = (file: File) => {
    if (!file.name.endsWith(".p8")) {
      setUploadError("Please upload a .p8 key file from App Store Connect");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      if (
        !content.includes("-----BEGIN PRIVATE KEY-----") ||
        !content.includes("-----END PRIVATE KEY-----")
      ) {
        setUploadError("Invalid .p8 file. The file should contain a private key.");
        return;
      }

      const extractedKeyId = extractKeyIdFromFilename(file.name);

      setFormData((prev) => ({
        ...prev,
        applePrivateKey: content.trim(),
        ...(extractedKeyId && !prev.appleKeyId ? { appleKeyId: extractedKeyId } : {}),
      }));
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  };

  // JSON file handling
  const handleJsonFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJson(false);
    setUploadError(null);
    const file = e.dataTransfer.files[0];
    if (file) processJsonFile(file);
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadError(null);
      processJsonFile(file);
    }
  };

  const processJsonFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setUploadError("Please upload a .json service account file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      try {
        const json = JSON.parse(content);
        if (!json.client_email || !json.private_key) {
          setUploadError("Invalid service account file. Missing required fields.");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          googleServiceAccount: content,
        }));
      } catch {
        setUploadError("Invalid JSON file");
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    // First create the app
    const newApp = await createApp.mutateAsync({
      name: formData.name,
      bundleId: formData.bundleId || undefined,
      packageName: formData.packageName || undefined,
    });

    // Then update with store credentials if provided
    const hasAppleCredentials =
      formData.applePrivateKey && formData.appleKeyId && formData.appleIssuerId;
    const hasGoogleCredentials = formData.googleServiceAccount;

    if (hasAppleCredentials || hasGoogleCredentials) {
      await updateApp.mutateAsync({
        appId: newApp.id,
        ...(hasAppleCredentials && {
          applePrivateKey: formData.applePrivateKey,
          appleKeyId: formData.appleKeyId,
          appleIssuerId: formData.appleIssuerId,
          appleVendorNumber: formData.appleVendorNumber || null,
        }),
        ...(hasGoogleCredentials && {
          googleServiceAccount: formData.googleServiceAccount,
        }),
      });
    } else {
      router.push(`/dashboard/${orgId}/apps`);
      router.refresh();
    }
  };

  const steps = getSteps();
  const isLoading = createApp.isPending || updateApp.isPending;

  const hasAppleConfig =
    formData.applePrivateKey && formData.appleKeyId && formData.appleIssuerId;
  const hasGoogleConfig = formData.googleServiceAccount;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <Link
        href={`/dashboard/${orgId}/apps`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Apps</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New App</h1>
        <p className="text-muted-foreground">
          Set up a new mobile app to track purchases and subscriptions
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, index) => {
          const isCurrent = step === s.id;
          const isPast =
            steps.findIndex((st) => st.id === step) >
            steps.findIndex((st) => st.id === s.id);

          return (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isPast
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {isPast ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={`text-sm whitespace-nowrap ${
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {(createApp.error || updateApp.error) && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {createApp.error?.message || updateApp.error?.message}
        </div>
      )}

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">App Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="My Awesome App"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name to identify your app in the dashboard
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Platforms */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Select the platforms your app supports
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* iOS */}
              <button
                onClick={() => togglePlatform("ios")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.platforms.includes("ios")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Apple className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold">iOS</p>
                <p className="text-sm text-muted-foreground">App Store</p>
              </button>

              {/* Android */}
              <button
                onClick={() => togglePlatform("android")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.platforms.includes("android")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Play className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold">Android</p>
                <p className="text-sm text-muted-foreground">Google Play</p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(getNextStep())}
                disabled={formData.platforms.length === 0}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Apple Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                <Apple className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">App Store Connect</h2>
                <p className="text-sm text-muted-foreground">
                  Configure iOS app settings
                </p>
              </div>
            </div>

            {/* Bundle ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Bundle ID *</label>
                <a
                  href="https://appstoreconnect.apple.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Find in App Store Connect
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={formData.bundleId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bundleId: e.target.value }))
                }
                placeholder="com.example.myapp"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            {/* API Configuration Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">App Store Connect API</h3>
                  <p className="text-xs text-muted-foreground">
                    Required to sync products and validate purchases
                  </p>
                </div>
                <a
                  href="https://appstoreconnect.apple.com/access/integrations/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Create API Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Status indicator */}
              {hasAppleConfig ? (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      API credentials configured
                    </span>
                  </div>
                </div>
              ) : null}

              {/* P8 File Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Private Key (.p8 file)</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingP8(true);
                  }}
                  onDragLeave={() => setIsDraggingP8(false)}
                  onDrop={handleP8FileDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDraggingP8
                      ? "border-primary bg-primary/5"
                      : formData.applePrivateKey
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {formData.applePrivateKey ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Private key uploaded</span>
                    </div>
                  ) : (
                    <>
                      <Upload
                        className={`w-8 h-8 mx-auto mb-2 ${
                          isDraggingP8 ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm text-primary mb-1">
                        Drop a file here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format: <span className="font-mono">AuthKey_XXXXXXXXXX.p8</span>
                      </p>
                    </>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 mt-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer text-sm">
                    <FileKey className="w-4 h-4" />
                    <span>{formData.applePrivateKey ? "Replace" : "Select"} File</span>
                    <input
                      type="file"
                      accept=".p8"
                      onChange={handleP8FileChange}
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

              {/* Key ID & Issuer ID */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Key ID</label>
                  <input
                    type="text"
                    value={formData.appleKeyId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appleKeyId: e.target.value }))
                    }
                    placeholder="XXXXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    10-character alphanumeric ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Issuer ID</label>
                  <input
                    type="text"
                    value={formData.appleIssuerId}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appleIssuerId: e.target.value }))
                    }
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    UUID shown at top of Keys page
                  </p>
                </div>
              </div>

              {/* Vendor Number (optional) */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Vendor Number <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.appleVendorNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, appleVendorNumber: e.target.value }))
                  }
                  placeholder="8XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Found in App Store Connect → Payments and Financial Reports
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">
                    <strong className="text-blue-400">How to get credentials:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Go to{" "}
                      <a
                        href="https://appstoreconnect.apple.com/access/integrations/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        App Store Connect → Integrations → API
                      </a>
                    </li>
                    <li>Click &quot;+&quot; to generate a new key with App Manager access</li>
                    <li>Download the .p8 file (one-time download!)</li>
                    <li>Copy the Key ID and Issuer ID shown on the page</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(getPrevStep())}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(getNextStep())}
                disabled={!formData.bundleId}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!hasAppleConfig && (
                  <>
                    <SkipForward className="w-4 h-4" />
                    Skip for now
                  </>
                )}
                {hasAppleConfig && "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Google Configuration */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Google Play Console</h2>
                <p className="text-sm text-muted-foreground">
                  Configure Android app settings
                </p>
              </div>
            </div>

            {/* Package Name */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Package Name *</label>
                <a
                  href="https://play.google.com/console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Find in Play Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={formData.packageName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, packageName: e.target.value }))
                }
                placeholder="com.example.myapp"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>

            {/* Service Account Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Google Play API</h3>
                  <p className="text-xs text-muted-foreground">
                    Required to sync products and validate purchases
                  </p>
                </div>
                <a
                  href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Create Service Account
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Status indicator */}
              {hasGoogleConfig ? (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      Service account configured
                    </span>
                  </div>
                </div>
              ) : null}

              {/* JSON File Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Service Account Key (.json file)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingJson(true);
                  }}
                  onDragLeave={() => setIsDraggingJson(false)}
                  onDrop={handleJsonFileDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    isDraggingJson
                      ? "border-primary bg-primary/5"
                      : formData.googleServiceAccount
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {formData.googleServiceAccount ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Service account key uploaded</span>
                    </div>
                  ) : (
                    <>
                      <Upload
                        className={`w-8 h-8 mx-auto mb-2 ${
                          isDraggingJson ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm text-primary mb-1">
                        Drop a file here, or click to select
                      </p>
                      <p className="text-xs text-muted-foreground">JSON key file</p>
                    </>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 mt-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer text-sm">
                    <FileKey className="w-4 h-4" />
                    <span>
                      {formData.googleServiceAccount ? "Replace" : "Select"} File
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">
                    <strong className="text-blue-400">How to get credentials:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Google Cloud Console → IAM → Service Accounts
                      </a>
                    </li>
                    <li>Create a new service account</li>
                    <li>Create a JSON key and download it</li>
                    <li>
                      In Play Console, grant this service account access under{" "}
                      <span className="text-foreground">
                        Users and Permissions → Invite User
                      </span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(getPrevStep())}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!formData.packageName}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!hasGoogleConfig && (
                  <>
                    <SkipForward className="w-4 h-4" />
                    Skip for now
                  </>
                )}
                {hasGoogleConfig && "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Review & Create</h2>

            {/* App Summary */}
            <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {formData.name[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-semibold">{formData.name}</p>
                  <div className="flex gap-2 mt-1">
                    {formData.platforms.map((p) => (
                      <span
                        key={p}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          p === "ios"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {p === "ios" ? "iOS" : "Android"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* iOS Config Summary */}
              {formData.platforms.includes("ios") && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Apple className="w-4 h-4" />
                    <span className="font-medium text-sm">App Store</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Bundle ID</p>
                      <p className="font-mono">{formData.bundleId || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">API Key</p>
                      <p className={hasAppleConfig ? "text-green-400" : "text-yellow-400"}>
                        {hasAppleConfig ? "✓ Configured" : "Not configured"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Android Config Summary */}
              {formData.platforms.includes("android") && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="w-4 h-4" />
                    <span className="font-medium text-sm">Google Play</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Package Name</p>
                      <p className="font-mono">{formData.packageName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service Account</p>
                      <p className={hasGoogleConfig ? "text-green-400" : "text-yellow-400"}>
                        {hasGoogleConfig ? "✓ Configured" : "Not configured"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Missing config warning */}
            {(!hasAppleConfig && formData.platforms.includes("ios")) ||
            (!hasGoogleConfig && formData.platforms.includes("android")) ? (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-400 font-medium">
                      Some store credentials are not configured
                    </p>
                    <p className="text-muted-foreground mt-1">
                      You can add them later in the app settings. Without credentials, you
                      won&apos;t be able to sync products or validate purchases automatically.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(getPrevStep())}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Create App"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
