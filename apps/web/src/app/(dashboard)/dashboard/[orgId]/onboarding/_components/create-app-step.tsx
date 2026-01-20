"use client";

import { CreateAppForm } from "@/components/app-setup";

export function CreateAppStep({
  onAppCreated,
  existingApps,
}: {
  onAppCreated: (appId: string) => void;
  existingApps: { id: string; name: string }[];
}) {
  return (
    <CreateAppForm
      onAppCreated={onAppCreated}
      existingApps={existingApps}
      showExistingApps={true}
    />
  );
}
