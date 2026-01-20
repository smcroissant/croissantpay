"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function RestartOnboardingButton({ orgId }: { orgId: string }) {
  const router = useRouter();

  const handleRestart = () => {
    if (!confirm("This will open the app setup wizard. Continue?")) {
      return;
    }
    router.push(`/dashboard/${orgId}/apps/new`);
  };

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
    >
      <RotateCcw className="w-4 h-4" />
      Setup New App
    </button>
  );
}
