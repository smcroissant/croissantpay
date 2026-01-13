"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Building2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const acceptInvitation = trpc.organizations.acceptInvitation.useMutation({
    onSuccess: () => {
      setStatus("success");
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (token) {
      acceptInvitation.mutate({ token });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Accepting Invitation</h1>
              <p className="text-muted-foreground">
                Please wait while we process your invitation...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to the Team!</h1>
              <p className="text-muted-foreground mb-6">
                Your invitation has been accepted. Redirecting to dashboard...
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Building2 className="w-5 h-5" />
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Invitation Failed</h1>
              <p className="text-muted-foreground mb-6">
                {errorMessage || "This invitation is invalid or has expired."}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full justify-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors w-full justify-center"
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <a
            href="mailto:support@croissantpay.dev"
            className="text-primary hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

