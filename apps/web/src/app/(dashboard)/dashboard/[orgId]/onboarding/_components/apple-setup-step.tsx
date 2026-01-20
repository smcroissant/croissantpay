"use client";

import { AppleSetupForm } from "@/components/app-setup";

export function AppleSetupStep({ appId }: { appId: string | null }) {
  return <AppleSetupForm appId={appId} showSuccessMessage={true} />;
}
