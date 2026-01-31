"use client";

import { useState } from "react";
import Link from "next/link";
import { Smartphone, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${baseUrl}/reset-password`,
      });

      if (result?.error) {
        setError(result.error.message || "Something went wrong");
      } else {
        // Always show success to avoid revealing whether the email exists
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 animated-gradient">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl">CroissantPay</span>
          </Link>

          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm mb-6">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Back to sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animated-gradient">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">CroissantPay</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Forgot password</h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
