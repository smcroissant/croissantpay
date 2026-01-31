"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Smartphone, Mail, Lock, ArrowRight, Github, Fingerprint } from "lucide-react";
import { signIn, authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [lastMethod, setLastMethod] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  // Get last used login method on mount
  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod?.();
    setLastMethod(method || null);
    
    // Preload passkey for conditional UI
    if (
      typeof window !== "undefined" &&
      window.PublicKeyCredential?.isConditionalMediationAvailable
    ) {
      window.PublicKeyCredential.isConditionalMediationAvailable().then(
        (available) => {
          if (available) {
            authClient.signIn.passkey?.({ autoFill: true });
          }
        }
      );
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.error) {
        setError(result.error.message || "Login failed");
      } else if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
        router.push("/login/verify-2fa");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err) {
      setError("OAuth sign in failed");
    }
  };

  const handlePasskeySignIn = async () => {
    setError("");
    setPasskeyLoading(true);

    try {
      const result = await authClient.signIn.passkey?.();

      if (result?.error) {
        setError(result.error.message || "Passkey sign in failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Passkey sign in failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const LastUsedBadge = () => (
    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
      Last used
    </span>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 animated-gradient">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl">CroissantPay</span>
        </Link>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to your account
          </p>

          {/* Passkey Sign In */}
          <button
            onClick={handlePasskeySignIn}
            disabled={isSubmitting || passkeyLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl mb-4 transition-colors ${
              lastMethod === "passkey"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <Fingerprint className="w-5 h-5" />
            <span>Sign in with Passkey</span>
            {lastMethod === "passkey" && <LastUsedBadge />}
          </button>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn("github")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                lastMethod === "github"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
              {lastMethod === "github" && <LastUsedBadge />}
            </button>
            <button
              onClick={() => handleOAuthSignIn("google")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                lastMethod === "google"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
              {lastMethod === "google" && <LastUsedBadge />}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {resetSuccess && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                Your password has been reset. You can sign in with your new password.
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
                {lastMethod === "email" && <LastUsedBadge />}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="username webauthn"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border focus:ring-1 focus:ring-primary outline-none transition-colors ${
                    errors.email ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password webauthn"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border focus:ring-1 focus:ring-primary outline-none transition-colors ${
                    errors.password ? "border-red-500" : "border-border focus:border-primary"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-secondary"
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                lastMethod === "email"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6 animated-gradient">
          <div className="w-full max-w-md flex justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
