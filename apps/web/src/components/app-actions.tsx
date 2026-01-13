"use client";

import { useState } from "react";
import { RefreshCw, TestTube, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function RotateKeysButton({ appId }: { appId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const rotateKeys = trpc.apps.rotateKeys.useMutation({
    onSuccess: () => {
      setShowConfirm(false);
      window.location.reload();
    },
  });

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-yellow-500">Are you sure?</span>
        <button
          onClick={() => rotateKeys.mutate({ appId })}
          disabled={rotateKeys.isPending}
          className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {rotateKeys.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Yes"
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 rounded-lg bg-secondary text-sm hover:bg-secondary/80 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm"
    >
      <RefreshCw className="w-4 h-4" />
      Rotate Keys
    </button>
  );
}

export function SendTestWebhookButton({ appId }: { appId: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTest = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/webhooks/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          platform: "ios",
          eventType: "SUBSCRIBED",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send test webhook");
      }

      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={sendTest}
        disabled={sent}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm disabled:opacity-50"
      >
        {sent ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            Sent!
          </>
        ) : (
          <>
            <TestTube className="w-4 h-4" />
            Send Test
          </>
        )}
      </button>
    </div>
  );
}

