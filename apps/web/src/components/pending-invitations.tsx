"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Building2, CheckCircle, X, Loader2, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function PendingInvitations() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: invitations, isLoading } =
    trpc.organizations.myInvitations.useQuery();

  const acceptInvitation = trpc.organizations.acceptInvitation.useMutation({
    onSuccess: () => {
      utils.organizations.myInvitations.invalidate();
      utils.organizations.list.invalidate();
      router.refresh();
    },
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (isLoading || !invitations || invitations.length === 0) {
    return null;
  }

  const visibleInvitations = invitations.filter(
    (inv) => !dismissedIds.has(inv.id)
  );

  if (visibleInvitations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">Pending Invitations</span>
      </div>

      <div className="space-y-2">
        {visibleInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {invitation.organizationName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Role: {invitation.role} · Expires{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setDismissedIds((prev) => new Set(prev).add(invitation.id))
                }
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  acceptInvitation.mutate({ token: invitation.token })
                }
                disabled={acceptInvitation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {acceptInvitation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

