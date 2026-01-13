"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  Trash2,
  Mail,
  Shield,
  Crown,
  Clock,
  X,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function TeamSettings({ orgId }: { orgId: string }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: members, isLoading: loadingMembers } =
    trpc.organizations.listMembers.useQuery();

  const { data: invitations, isLoading: loadingInvitations } =
    trpc.organizations.listInvitations.useQuery();

  const inviteMember = trpc.organizations.inviteMember.useMutation({
    onSuccess: (data) => {
      utils.organizations.listInvitations.invalidate();
      setInviteEmail("");
      // Show the invite URL
      if (data.inviteUrl) {
        setCopiedUrl(data.inviteUrl);
      }
    },
  });

  const cancelInvitation = trpc.organizations.cancelInvitation.useMutation({
    onSuccess: () => {
      utils.organizations.listInvitations.invalidate();
    },
  });

  const removeMember = trpc.organizations.removeMember.useMutation({
    onSuccess: () => {
      utils.organizations.listMembers.invalidate();
    },
  });

  const updateRole = trpc.organizations.updateMemberRole.useMutation({
    onSuccess: () => {
      utils.organizations.listMembers.invalidate();
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteMember.mutate({ email: inviteEmail, role: inviteRole });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 3000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: "bg-yellow-500/10 text-yellow-500",
      admin: "bg-blue-500/10 text-blue-500",
      member: "bg-secondary text-muted-foreground",
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  if (loadingMembers) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Team Members</h2>
              <p className="text-sm text-muted-foreground">
                {members?.length || 0} member{members?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        </div>

        <div className="space-y-2">
          {members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name || ""}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                    member.role
                  )}`}
                >
                  {getRoleIcon(member.role)}
                  {member.role}
                </span>

                {member.role !== "owner" && (
                  <div className="flex items-center gap-1">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          userId: member.id,
                          role: e.target.value as "admin" | "member",
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-secondary border border-border text-sm"
                      disabled={updateRole.isPending}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this member?")) {
                          removeMember.mutate({ userId: member.id });
                        }
                      }}
                      disabled={removeMember.isPending}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
              <p className="text-sm text-muted-foreground">
                {invitations.length} pending
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited by {invitation.invitedBy}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(
                        invitation.role
                      )}`}
                    >
                      {invitation.role}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      cancelInvitation.mutate({ invitationId: invitation.id })
                    }
                    disabled={cancelInvitation.isPending}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowInviteModal(false);
              setCopiedUrl(null);
            }}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Invite Team Member</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setCopiedUrl(null);
                }}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteMember.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {inviteMember.error.message}
                </div>
              )}

              {inviteMember.isSuccess && copiedUrl && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-green-500 text-sm mb-2">
                    Invitation created! Share this link:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={copiedUrl}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(copiedUrl)}
                      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {copiedUrl === copiedUrl ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "member" | "admin")
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="member">Member - View and use apps</option>
                  <option value="admin">Admin - Manage apps and team</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setCopiedUrl(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMember.isPending || !inviteEmail}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteMember.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

