"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Apple,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  FileKey,
  CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { appleConfigSchema, type AppleConfigFormData } from "./schemas";

interface AppleSetupFormProps {
  appId: string | null;
  onSaved?: () => void;
  showSuccessMessage?: boolean;
}

export function AppleSetupForm({
  appId,
  onSaved,
  showSuccessMessage = true,
}: AppleSetupFormProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDraggingP8, setIsDraggingP8] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<AppleConfigFormData>({
    resolver: zodResolver(appleConfigSchema),
    defaultValues: {
      appleIssuerId: "",
      appleKeyId: "",
      applePrivateKey: "",
      appleSharedSecret: "",
      appleVendorNumber: "",
    },
  });

  const { data: app } = trpc.apps.get.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  const updateAppMutation = trpc.apps.update.useMutation({
    onSuccess: () => {
      setSuccess(true);
      onSaved?.();
    },
    onError: (err) => {
      form.setError("root", { message: err.message });
    },
  });

  // Pre-fill if app already has Apple config
  useEffect(() => {
    if (app) {
      form.reset({
        appleIssuerId: app.appleIssuerId || "",
        appleKeyId: app.appleKeyId || "",
        applePrivateKey: "", // Don't pre-fill for security
        appleSharedSecret: app.appleSharedSecret || "",
        appleVendorNumber: app.appleVendorNumber || "",
      });
    }
  }, [app, form]);

  // P8 file handling
  const extractKeyIdFromFilename = (filename: string): string | null => {
    const match = filename.match(
      /(?:AuthKey|SubscriptionKey)_([A-Z0-9]+)\.p8$/i
    );
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
        setUploadError(
          "Invalid .p8 file. The file should contain a private key."
        );
        return;
      }

      const extractedKeyId = extractKeyIdFromFilename(file.name);
      const currentKeyId = form.getValues("appleKeyId");

      form.setValue("applePrivateKey", content.trim());
      if (extractedKeyId && !currentKeyId) {
        form.setValue("appleKeyId", extractedKeyId);
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  };

  const onSubmit = (data: AppleConfigFormData) => {
    if (!appId) return;
    setSuccess(false);

    updateAppMutation.mutate({
      appId,
      appleIssuerId: data.appleIssuerId || null,
      appleKeyId: data.appleKeyId || null,
      applePrivateKey: data.applePrivateKey || null,
      appleSharedSecret: data.appleSharedSecret || null,
      appleVendorNumber: data.appleVendorNumber || null,
    });
  };

  if (!appId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground">
          Please create an app first in the previous step.
        </p>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  const applePrivateKey = watch("applePrivateKey");
  const hasPrivateKey = !!applePrivateKey;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Connect your app to Apple App Store Connect to enable iOS in-app
        purchases.
      </p>

      {showSuccessMessage && success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Apple configuration saved successfully!
        </div>
      )}

      {errors.root && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {errors.root.message}
        </div>
      )}

      <div className="bg-secondary/30 rounded-xl p-6 mb-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Apple className="w-5 h-5" />
          Get credentials from App Store Connect
        </h4>
        <ol className="text-sm space-y-2 text-muted-foreground">
          <li>
            1. Go to{" "}
            <a
              href="https://appstoreconnect.apple.com/access/integrations/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              App Store Connect → Integrations → App Store Connect API
            </a>
          </li>
          <li>2. Copy your Issuer ID (shown at top)</li>
          <li>
            3. Click &quot;Generate API Key&quot; with &quot;In-App
            Purchase&quot; access
          </li>
          <li>4. Download the .p8 file and copy the Key ID</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Issuer ID</label>
          <input
            {...register("appleIssuerId")}
            type="text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Key ID</label>
          <input
            {...register("appleKeyId")}
            type="text"
            placeholder="XXXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            10-character alphanumeric ID
          </p>
        </div>

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
                : hasPrivateKey
                ? "border-green-500/50 bg-green-500/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {hasPrivateKey ? (
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
              <span>{hasPrivateKey ? "Replace" : "Select"} File</span>
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

          {/* Alternative: paste key manually */}
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
              Or paste key contents manually
            </summary>
            <div className="mt-3 relative">
              <textarea
                {...register("applePrivateKey")}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm resize-none"
              />
              <button
                type="button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground"
              >
                {showPrivateKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </details>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Vendor Number{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            {...register("appleVendorNumber")}
            type="text"
            placeholder="8XXXXXXXX"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Found in App Store Connect → Payments and Financial Reports
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Shared Secret{" "}
            <span className="text-muted-foreground">(legacy apps only)</span>
          </label>
          <input
            {...register("appleSharedSecret")}
            type="text"
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={updateAppMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {updateAppMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Apple className="w-4 h-4" />
              Save Apple Configuration
            </>
          )}
        </button>
      </form>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <p className="text-sm text-orange-400">
          <strong>Important:</strong> Store your .p8 private key safely! Apple
          only lets you download it once.
        </p>
      </div>
    </div>
  );
}
