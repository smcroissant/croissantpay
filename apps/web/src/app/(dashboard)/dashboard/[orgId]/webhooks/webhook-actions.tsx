"use client";

import { useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface WebhookActionsProps {
  appId: string;
  platform: "apple" | "google";
  showGenerate?: boolean;
}

export function WebhookActions({ appId, platform, showGenerate }: WebhookActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const regenerateMutation = trpc.apps.regenerateWebhookId.useMutation({
    onSuccess: () => {
      router.refresh();
      setShowConfirm(false);
    },
    onError: (error: unknown) => {
      console.error("Failed to regenerate webhook ID:", error);
      alert("Failed to regenerate webhook ID");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleRegenerate = () => {
    setIsLoading(true);
    regenerateMutation.mutate({ appId, platform });
  };

  if (showGenerate) {
    return (
      <button
        onClick={handleRegenerate}
        disabled={isLoading}
        className="ml-2 inline-flex items-center gap-1 text-primary hover:underline text-sm disabled:opacity-50"
      >
        {isLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
        Generate
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate ID
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Regenerate Webhook ID?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will generate a new webhook URL for {platform === "apple" ? "Apple" : "Google"}. 
              You will need to update the webhook URL in{" "}
              {platform === "apple" ? "App Store Connect" : "Google Cloud Console"} after regenerating.
            </p>
            <p className="text-sm text-yellow-500 mb-4">
              ⚠️ The old webhook URL will stop working immediately.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
