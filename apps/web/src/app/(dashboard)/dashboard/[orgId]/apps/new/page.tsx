"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Apple, Play, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function NewAppPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    bundleId: "",
    packageName: "",
    platforms: [] as ("ios" | "android")[],
  });

  const createApp = trpc.apps.create.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}/apps`);
      router.refresh();
    },
  });

  const togglePlatform = (platform: "ios" | "android") => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = () => {
    createApp.mutate({
      name: formData.name,
      bundleId: formData.bundleId || undefined,
      packageName: formData.packageName || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Link
        href={`/dashboard/${orgId}/apps`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Apps</span>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create New App</h1>
        <p className="text-muted-foreground">
          Set up a new mobile app to track purchases and subscriptions
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span
              className={`text-sm ${
                step >= s ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s === 1 ? "Basic Info" : s === 2 ? "Platforms" : "Review"}
            </span>
            {s < 3 && <div className="w-12 h-0.5 bg-border" />}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {createApp.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {createApp.error.message}
        </div>
      )}

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">App Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="My Awesome App"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A friendly name to identify your app
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.name}
              className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Platforms */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Select the platforms your app supports
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* iOS */}
              <button
                onClick={() => togglePlatform("ios")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.platforms.includes("ios")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Apple className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold">iOS</p>
                <p className="text-sm text-muted-foreground">App Store</p>
              </button>

              {/* Android */}
              <button
                onClick={() => togglePlatform("android")}
                className={`p-6 rounded-xl border-2 transition-all ${
                  formData.platforms.includes("android")
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Play className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold">Android</p>
                <p className="text-sm text-muted-foreground">Google Play</p>
              </button>
            </div>

            {/* Bundle ID / Package Name */}
            {formData.platforms.includes("ios") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  iOS Bundle ID
                </label>
                <input
                  type="text"
                  value={formData.bundleId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bundleId: e.target.value }))
                  }
                  placeholder="com.example.myapp"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
            )}

            {formData.platforms.includes("android") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Android Package Name
                </label>
                <input
                  type="text"
                  value={formData.packageName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      packageName: e.target.value,
                    }))
                  }
                  placeholder="com.example.myapp"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.platforms.length === 0}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {formData.name[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-semibold">{formData.name}</p>
                  <div className="flex gap-2 mt-1">
                    {formData.platforms.map((p) => (
                      <span
                        key={p}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          p === "ios"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {p === "ios" ? "iOS" : "Android"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {formData.bundleId && (
                <div>
                  <p className="text-xs text-muted-foreground">Bundle ID</p>
                  <p className="font-mono text-sm">{formData.bundleId}</p>
                </div>
              )}

              {formData.packageName && (
                <div>
                  <p className="text-xs text-muted-foreground">Package Name</p>
                  <p className="font-mono text-sm">{formData.packageName}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={createApp.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={createApp.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createApp.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Create App"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

