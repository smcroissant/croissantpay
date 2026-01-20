"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Smartphone,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { createAppSchema, type CreateAppFormData } from "./schemas";

interface AppFormFieldsProps {
  form: ReturnType<typeof useForm<CreateAppFormData>>;
  onSubmit: (data: CreateAppFormData) => void;
  isPending: boolean;
  submitLabel?: string;
}

export function AppFormFields({
  form,
  onSubmit,
  isPending,
  submitLabel = "Create App",
}: AppFormFieldsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors.root.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          App Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          placeholder="My Awesome App"
          className={`w-full px-4 py-3 rounded-xl bg-secondary border ${
            errors.name ? "border-red-500" : "border-border"
          } focus:border-primary focus:outline-none transition-colors`}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          iOS Bundle ID <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          {...register("bundleId")}
          type="text"
          placeholder="com.yourcompany.yourapp"
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Found in Xcode → Your Target → General → Bundle Identifier
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Android Package Name{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          {...register("packageName")}
          type="text"
          placeholder="com.yourcompany.yourapp"
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Found in android/app/build.gradle → applicationId
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            {submitLabel}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

interface CreateAppFormProps {
  onAppCreated: (appId: string) => void;
  existingApps?: { id: string; name: string }[];
  showExistingApps?: boolean;
}

export function CreateAppForm({
  onAppCreated,
  existingApps = [],
  showExistingApps = true,
}: CreateAppFormProps) {
  const form = useForm<CreateAppFormData>({
    resolver: zodResolver(createAppSchema),
    defaultValues: {
      name: "",
      bundleId: "",
      packageName: "",
    },
  });

  const createAppMutation = trpc.apps.create.useMutation({
    onSuccess: (data) => {
      onAppCreated(data.id);
    },
    onError: (err) => {
      form.setError("root", { message: err.message });
    },
  });

  const onSubmit = (data: CreateAppFormData) => {
    createAppMutation.mutate({
      name: data.name,
      bundleId: data.bundleId || undefined,
      packageName: data.packageName || undefined,
    });
  };

  // If apps already exist and we want to show them, show option to select or create new
  if (showExistingApps && existingApps.length > 0) {
    return (
      <div className="space-y-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            You already have {existingApps.length} app(s) configured. You can
            continue with an existing app or create a new one.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Your Apps</h4>
          {existingApps.map((app) => (
            <button
              key={app.id}
              onClick={() => onAppCreated(app.id)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{app.name}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or create new
            </span>
          </div>
        </div>

        <AppFormFields
          form={form}
          onSubmit={onSubmit}
          isPending={createAppMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Create an app in CroissantPay. This will be linked to your iOS and/or
        Android app.
      </p>

      <AppFormFields
        form={form}
        onSubmit={onSubmit}
        isPending={createAppMutation.isPending}
      />

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> You can create one app that supports both iOS
          and Android, or create separate apps for each platform.
        </p>
      </div>
    </div>
  );
}
