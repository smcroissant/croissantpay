"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface OrgDangerZoneProps {
  orgId: string;
  orgName: string;
  isOwner: boolean;
}

export function OrgDangerZone({ orgId, orgName, isOwner }: OrgDangerZoneProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const deleteOrg = trpc.organizations.delete.useMutation({
    onSuccess: () => {
      // Invalidate orgs list and redirect to dashboard
      utils.organizations.list.invalidate();
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleDelete = () => {
    setError(null);
    deleteOrg.mutate({ confirmName });
  };

  const isNameMatch = confirmName === orgName;

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <div className="bg-card border border-red-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Irreversible organization actions
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-red-500">Delete Organization</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete this organization and all its data including
                  apps, products, subscribers, and analytics.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delete Organization</h3>
                <p className="text-sm text-muted-foreground">
                  This action is permanent
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-sm text-muted-foreground">
                  This will permanently delete:
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All apps and their configurations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All products, entitlements, and offerings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All subscribers and purchase history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    All team members will lose access
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="font-mono text-red-500">{orgName}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!isNameMatch || deleteOrg.isPending}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteOrg.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



