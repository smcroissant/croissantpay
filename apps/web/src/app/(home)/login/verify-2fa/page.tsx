"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Smartphone, Shield, Loader2, ArrowLeft, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"totp" | "otp" | "backup">("totp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleVerifyTOTP = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.sendOtp();

      if (result.error) {
        setError(result.error.message || "Failed to send code");
        return;
      }

      setOtpSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.verifyOtp({
        code,
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackup = async () => {
    if (!code) {
      setError("Please enter a backup code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authClient.twoFactor.verifyBackupCode({
        code,
        trustDevice,
      });

      if (result.error) {
        setError(result.error.message || "Invalid backup code");
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (method === "totp") {
      handleVerifyTOTP();
    } else if (method === "otp") {
      handleVerifyOTP();
    } else {
      handleVerifyBackup();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">CroissantPay</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Verification</h1>
            <p className="text-muted-foreground mt-2">
              Enter the verification code to continue
            </p>
          </div>

          {/* Method Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => {
                setMethod("totp");
                setCode("");
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                method === "totp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Authenticator
            </button>
            <button
              onClick={() => {
                setMethod("otp");
                setCode("");
                setError(null);
                setOtpSent(false);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                method === "otp"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => {
                setMethod("backup");
                setCode("");
                setError(null);
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                method === "backup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Backup
            </button>
          </div>

          {/* TOTP Method */}
          {method === "totp" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-4 py-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>
          )}

          {/* OTP Method */}
          {method === "otp" && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    We&apos;ll send a verification code to your email
                  </p>
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5" />
                    )}
                    Send Code to Email
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  <button
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Didn&apos;t receive it? Send again
                  </button>
                </>
              )}
            </div>
          )}

          {/* Backup Code Method */}
          {method === "backup" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter one of your backup codes
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-4 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-center font-mono"
                placeholder="XXXX-XXXX-XXXX"
                autoFocus
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Trust Device */}
          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              Trust this device for 30 days
            </span>
          </label>

          {/* Verify Button */}
          {(method === "totp" || (method === "otp" && otpSent) || method === "backup") && (
            <button
              onClick={handleVerify}
              disabled={loading || !code}
              className="w-full mt-6 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify"
              )}
            </button>
          )}

          {/* Back to Login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
