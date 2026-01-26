"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ArrowLeft,
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  Loader2,
  Check,
  X,
  LogOut,
  Key,
  QrCode,
  Copy,
  Fingerprint,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { authClient } from "@/lib/auth-client";
import { AccountDangerZone } from "./account-danger-zone";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 2FA State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Passkey State
  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeys, setPasskeys] = useState<Array<{
    id: string;
    name?: string | undefined;
    createdAt: Date | null;
    deviceType: string;
  }>>([]);

  // Fetch current user
  const { data: user, isLoading: userLoading, refetch: refetchUser } = trpc.users.me.useQuery();

  // Fetch sessions
  const { data: sessions, isLoading: sessionsLoading, refetch: refetchSessions } = trpc.users.getSessions.useQuery();

  // Mutations
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const revokeSession = trpc.users.revokeSession.useMutation({
    onSuccess: () => {
      refetchSessions();
    },
  });

  const revokeAllOther = trpc.users.revokeAllOtherSessions.useMutation({
    onSuccess: () => {
      refetchSessions();
    },
  });

  // Initialize name from user data
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  // Track changes
  useEffect(() => {
    if (user) {
      setHasChanges(name !== (user.name || ""));
    }
  }, [name, user]);

  // Load passkeys
  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      const result = await authClient.passkey.listUserPasskeys();
      if (result.data) {
        setPasskeys(result.data);
      }
    } catch (err) {
      console.error("Failed to load passkeys:", err);
    }
  };

  const handleSave = () => {
    if (name.trim()) {
      updateProfile.mutate({ name: name.trim() });
    }
  };

  // 2FA Functions
  const handleEnable2FA = async () => {
    if (!twoFactorPassword) {
      setTwoFactorError("Please enter your password");
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      const result = await authClient.twoFactor.enable({
        password: twoFactorPassword,
      });

      if (result.error) {
        setTwoFactorError(result.error.message || "Failed to enable 2FA");
        return;
      }

      if (result.data) {
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes);
        setShow2FASetup(true);
      }
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setTwoFactorError("Please enter a 6-digit code");
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: verifyCode,
      });

      if (result.error) {
        setTwoFactorError(result.error.message || "Invalid code");
        return;
      }

      // Success - reload user to get updated 2FA status
      setShow2FASetup(false);
      setShowBackupCodes(true);
      refetchUser();
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFactorPassword) {
      setTwoFactorError("Please enter your password");
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      const result = await authClient.twoFactor.disable({
        password: twoFactorPassword,
      });

      if (result.error) {
        setTwoFactorError(result.error.message || "Failed to disable 2FA");
        return;
      }

      setTwoFactorPassword("");
      refetchUser();
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Passkey Functions
  const handleAddPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyError(null);

    try {
      const result = await authClient.passkey.addPasskey({
        name: passkeyName || undefined,
      });

      if (result.error) {
        setPasskeyError(result.error.message || "Failed to add passkey");
        return;
      }

      setPasskeyName("");
      loadPasskeys();
    } catch (err: unknown) {
      setPasskeyError(err instanceof Error ? err.message : "Failed to add passkey");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    try {
      const result = await authClient.passkey.deletePasskey({
        id: passkeyId,
      });

      if (result.error) {
        setPasskeyError(result.error.message || "Failed to delete passkey");
        return;
      }

      loadPasskeys();
    } catch (err: unknown) {
      setPasskeyError(err instanceof Error ? err.message : "Failed to delete passkey");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: "Unknown", os: "Unknown", device: "desktop" };
    
    let browser = "Unknown";
    let os = "Unknown";
    let device = "desktop";

    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("iPhone") || ua.includes("iPad")) { os = "iOS"; device = "mobile"; }
    else if (ua.includes("Android")) { os = "Android"; device = "mobile"; }

    return { browser, os, device };
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];
  const is2FAEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CroissantPay</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="space-y-6 max-w-4xl mx-auto py-8 px-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal account settings and security
          </p>
        </div>

        {/* Profile Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile</h2>
              <p className="text-sm text-muted-foreground">
                Your personal information
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {hasChanges && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => setName(user.name || "")}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <Check className="w-4 h-4" />
                Profile updated successfully
              </div>
            )}
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            {is2FAEnabled && (
              <span className="ml-auto px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                Enabled
              </span>
            )}
          </div>

          {!is2FAEnabled && !show2FASetup && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account by requiring a verification code in addition to your password when signing in.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">Enter your password to enable 2FA</label>
                <input
                  type="password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Your password"
                />
              </div>
              {twoFactorError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {twoFactorError}
                </div>
              )}
              <button
                onClick={handleEnable2FA}
                disabled={twoFactorLoading || !twoFactorPassword}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {twoFactorLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Enable Two-Factor Authentication
              </button>
            </div>
          )}

          {show2FASetup && totpUri && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Step 1: Scan QR Code
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-xl">
                  {/* QR Code placeholder - in production use a QR code library */}
                  <div className="text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Or enter this code manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-secondary rounded text-xs break-all">
                      {totpUri.split("secret=")[1]?.split("&")[0] || totpUri}
                    </code>
                    <button
                      onClick={() => copyToClipboard(totpUri.split("secret=")[1]?.split("&")[0] || totpUri)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="font-medium mb-3">Step 2: Verify Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code from your authenticator app to verify setup.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-center text-xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={twoFactorLoading || verifyCode.length !== 6}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {twoFactorLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Verify
                  </button>
                </div>
                {twoFactorError && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {twoFactorError}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShow2FASetup(false);
                  setTotpUri(null);
                  setVerifyCode("");
                  setTwoFactorError(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel setup
              </button>
            </div>
          )}

          {showBackupCodes && backupCodes && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-500">Save your backup codes</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Store these codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-secondary rounded-xl">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono p-2 bg-background rounded">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(backupCodes.join("\n"))}
                  className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Codes
                </button>
                <button
                  onClick={() => {
                    setShowBackupCodes(false);
                    setBackupCodes(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  I&apos;ve saved my codes
                </button>
              </div>
            </div>
          )}

          {is2FAEnabled && !showBackupCodes && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-green-500">
                  Two-factor authentication is enabled. Your account is protected with an additional verification step.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Enter your password to disable 2FA</label>
                <input
                  type="password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Your password"
                />
              </div>
              {twoFactorError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {twoFactorError}
                </div>
              )}
              <button
                onClick={handleDisable2FA}
                disabled={twoFactorLoading || !twoFactorPassword}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {twoFactorLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Disable Two-Factor Authentication
              </button>
            </div>
          )}
        </div>

        {/* Passkeys */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Passkeys</h2>
              <p className="text-sm text-muted-foreground">
                Sign in securely without a password using biometrics or security keys
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Add Passkey */}
            <div className="p-4 rounded-xl bg-secondary/50">
              <h3 className="font-medium mb-3">Add a new passkey</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Passkey name (e.g., MacBook Pro)"
                />
                <button
                  onClick={handleAddPasskey}
                  disabled={passkeyLoading}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {passkeyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Passkey
                </button>
              </div>
              {passkeyError && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {passkeyError}
                </div>
              )}
            </div>

            {/* Passkey List */}
            {passkeys.length > 0 ? (
              <div className="space-y-3">
                {passkeys.map((pk) => (
                  <div
                    key={pk.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        {pk.deviceType === "platform" ? (
                          <Monitor className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Key className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{pk.name || "Unnamed Passkey"}</p>
                        <p className="text-sm text-muted-foreground">
                          Added {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePasskey(pk.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Fingerprint className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No passkeys registered</p>
                <p className="text-sm">Add a passkey for faster, more secure sign-in</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Active Sessions</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your active login sessions
                </p>
              </div>
            </div>
            {otherSessions.length > 0 && (
              <button
                onClick={() => revokeAllOther.mutate()}
                disabled={revokeAllOther.isPending}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm flex items-center gap-2"
              >
                {revokeAllOther.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LogOut className="w-3 h-3" />
                )}
                Sign out all other sessions
              </button>
            )}
          </div>

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => {
                const { browser, os, device } = parseUserAgent(session.userAgent);
                const DeviceIcon = device === "mobile" ? Smartphone : Monitor;

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl ${
                      session.isCurrent
                        ? "bg-green-500/5 border border-green-500/20"
                        : "bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            session.isCurrent
                              ? "bg-green-500/20 text-green-500"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <DeviceIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {browser} on {os}
                            </p>
                            {session.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {session.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {session.ipAddress}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() =>
                            revokeSession.mutate({ sessionId: session.id })
                          }
                          disabled={revokeSession.isPending}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Sign out this session"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No active sessions found
            </p>
          )}
        </div>

        {/* Danger Zone */}
        <AccountDangerZone userEmail={user.email || ""} />
      </div>
    </div>
  );
}
