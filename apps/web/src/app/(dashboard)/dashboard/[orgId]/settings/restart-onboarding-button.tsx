"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function RestartOnboardingButton({ orgId }: { orgId: string }) {
  const router = useRouter();

  const restartMutation = trpc.organizations.restartOnboarding.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/onboarding`);
    },
  });

  const handleRestart = () => {
    if (!confirm("This will reset your onboarding progress and show the setup guide from the beginning. Continue?")) {
      return;
    }
    restartMutation.mutate();
  };

  return (
    <button
      onClick={handleRestart}
      disabled={restartMutation.isPending}
      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-colors"
    >
      <RotateCcw className={`w-4 h-4 ${restartMutation.isPending ? "animate-spin" : ""}`} />
      {restartMutation.isPending ? "Restarting..." : "Restart Guide"}
    </button>
  );
}
