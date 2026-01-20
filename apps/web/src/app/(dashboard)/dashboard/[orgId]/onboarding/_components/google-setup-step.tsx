"use client";

import { GoogleSetupForm } from "@/components/app-setup";

export function GoogleSetupStep({ appId }: { appId: string | null }) {
  return <GoogleSetupForm appId={appId} showSuccessMessage={true} />;
}
