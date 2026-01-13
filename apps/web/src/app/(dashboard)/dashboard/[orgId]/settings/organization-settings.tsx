"use client";

import { useState, useEffect } from "react";
import { Building2, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface OrganizationSettingsProps {
  orgId: string;
  isOwner: boolean;
}

export function OrganizationSettings({ orgId, isOwner }: OrganizationSettingsProps) {
  const utils = trpc.useUtils();
  const { data: org, isLoading } = trpc.organizations.get.useQuery({ organizationId: orgId });
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setSlug(org.slug);
    }
  }, [org]);

  const updateOrg = trpc.organizations.update.useMutation({
    onSuccess: () => {
      utils.organizations.list.invalidate();
      utils.organizations.current.invalidate();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    },
  });

  const handleSave = () => {
    updateOrg.mutate({
      organizationId: orgId,
      name,
      slug,
    });
  };

  const hasChanges = org && (name !== org.name || slug !== org.slug);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Organization Details</h2>
          <p className="text-sm text-muted-foreground">
            {isOwner ? "Update your organization information" : "View organization information"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              disabled={!isOwner}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {updateOrg.error && (
              <p className="text-sm text-red-500">{updateOrg.error.message}</p>
            )}
            {isSaved && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved successfully
              </p>
            )}
            {!updateOrg.error && !isSaved && <div />}
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateOrg.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateOrg.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



