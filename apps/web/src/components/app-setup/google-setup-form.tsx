"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import { googleConfigSchema, type GoogleConfigFormData } from "./schemas";
import { GooglePlayIcon } from "./google-play-icon";

interface GoogleSetupFormProps {
  appId: string | null;
  onSaved?: () => void;
  showSuccessMessage?: boolean;
}

export function GoogleSetupForm({
  appId,
  onSaved,
  showSuccessMessage = true,
}: GoogleSetupFormProps) {
  const [showJson, setShowJson] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<GoogleConfigFormData>({
    resolver: zodResolver(googleConfigSchema),
    defaultValues: {
      googleServiceAccount: "",
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
          setUploadError(
            "Invalid service account file. Missing required fields."
          );
          return;
        }

        form.setValue("googleServiceAccount", content);
      } catch {
        setUploadError("Invalid JSON file");
      }
    };
    reader.onerror = () => setUploadError("Failed to read file");
    reader.readAsText(file);
  };

  const onSubmit = (data: GoogleConfigFormData) => {
    if (!appId) return;
    setSuccess(false);

    // Validate JSON
    if (data.googleServiceAccount?.trim()) {
      try {
        JSON.parse(data.googleServiceAccount);
      } catch {
        form.setError("googleServiceAccount", {
          message: "Invalid JSON format",
        });
        return;
      }
    }

    updateAppMutation.mutate({
      appId,
      googleServiceAccount: data.googleServiceAccount?.trim() || null,
    });
  };

  if (!appId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground">
          Please create an app first in step 1.
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

  const googleServiceAccount = watch("googleServiceAccount");
  const hasServiceAccount = !!googleServiceAccount;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Connect your app to Google Play Console to enable Android in-app
        purchases.
      </p>

      {showSuccessMessage && success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          Google configuration saved successfully!
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
          <GooglePlayIcon className="w-5 h-5" />
          Get Service Account JSON
        </h4>
        <ol className="text-sm space-y-2 text-muted-foreground">
          <li>
            1. Go to{" "}
            <a
              href="https://console.cloud.google.com/iam-admin/serviceaccounts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console → IAM → Service Accounts
            </a>
          </li>
          <li>2. Create a new service account or select existing</li>
          <li>3. Go to Keys tab → Add Key → Create new key → JSON</li>
          <li>
            4. Link the service account in{" "}
            <a
              href="https://play.google.com/console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Play Console → Settings → API access
            </a>
          </li>
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                : hasServiceAccount
                ? "border-green-500/50 bg-green-500/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {hasServiceAccount ? (
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
              <span>{hasServiceAccount ? "Replace" : "Select"} File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleJsonFileChange}
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

          {/* Alternative: paste JSON manually */}
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
              Or paste JSON contents manually
            </summary>
            <div className="mt-3 relative">
              <textarea
                {...register("googleServiceAccount")}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
                rows={8}
                className={`w-full px-4 py-3 rounded-xl bg-secondary border ${
                  errors.googleServiceAccount ? "border-red-500" : "border-border"
                } focus:border-primary focus:outline-none transition-colors font-mono text-sm resize-none`}
              />
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                className="absolute right-3 top-3 p-1 text-muted-foreground hover:text-foreground"
              >
                {showJson ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.googleServiceAccount && (
              <p className="text-red-400 text-sm mt-1">
                {errors.googleServiceAccount.message}
              </p>
            )}
          </details>
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
              <GooglePlayIcon className="w-4 h-4" />
              Save Google Configuration
            </>
          )}
        </button>
      </form>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> It can take up to 24 hours for service account
          permissions to propagate in Google Play Console.
        </p>
      </div>
    </div>
  );
}
