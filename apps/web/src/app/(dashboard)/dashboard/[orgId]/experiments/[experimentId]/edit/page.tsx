"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface VariantForm {
  id?: string;
  name: string;
  description: string;
  isControl: boolean;
  weight: number;
  offeringId?: string;
}

export default function EditExperimentPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;
  const experimentId = params.experimentId as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hypothesis: "",
    primaryMetric: "conversion_rate",
    trafficAllocation: 100,
  });

  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch experiment with variants
  const {
    data: experimentData,
    isLoading,
    error,
  } = trpc.experiments.get.useQuery({ experimentId });

  // Fetch offerings for variant selection
  const { data: offerings } = trpc.products.listOfferings.useQuery();

  // Update form when data loads
  useEffect(() => {
    if (experimentData) {
      setFormData({
        name: experimentData.experiment.name,
        description: experimentData.experiment.description || "",
        hypothesis: experimentData.experiment.hypothesis || "",
        primaryMetric: experimentData.experiment.primaryMetric || "conversion_rate",
        trafficAllocation: experimentData.experiment.trafficAllocation,
      });
      setVariants(
        experimentData.variants.map((v) => ({
          id: v.id,
          name: v.name,
          description: v.description || "",
          isControl: v.isControl,
          weight: v.weight,
          offeringId: v.offeringId || undefined,
        }))
      );
    }
  }, [experimentData]);

  const utils = trpc.useUtils();

  const updateExperiment = trpc.experiments.update.useMutation({
    onSuccess: () => {
      utils.experiments.list.invalidate();
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const deleteExperiment = trpc.experiments.delete.useMutation({
    onSuccess: () => {
      utils.experiments.list.invalidate();
      router.push(`/dashboard/${orgId}/experiments`);
      router.refresh();
    },
  });

  const startExperiment = trpc.experiments.start.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const pauseExperiment = trpc.experiments.pause.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const completeExperiment = trpc.experiments.complete.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const createVariant = trpc.experiments.createVariant.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const updateVariant = trpc.experiments.updateVariant.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const deleteVariant = trpc.experiments.deleteVariant.useMutation({
    onSuccess: () => {
      utils.experiments.get.invalidate({ experimentId });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateExperiment.mutateAsync({
      experimentId,
      name: formData.name,
      description: formData.description || undefined,
      hypothesis: formData.hypothesis || undefined,
      primaryMetric: formData.primaryMetric,
      trafficAllocation: formData.trafficAllocation,
    });

    // Update existing variants and create new ones
    for (const variant of variants) {
      if (variant.id) {
        await updateVariant.mutateAsync({
          variantId: variant.id,
          name: variant.name,
          description: variant.description || undefined,
          weight: variant.weight,
          offeringId: variant.offeringId,
        });
      } else {
        await createVariant.mutateAsync({
          experimentId,
          name: variant.name,
          description: variant.description || undefined,
          isControl: variant.isControl,
          weight: variant.weight,
          offeringId: variant.offeringId,
        });
      }
    }

    router.push(`/dashboard/${orgId}/experiments`);
  };

  const handleDelete = () => {
    deleteExperiment.mutate({ experimentId });
  };

  const handleAddVariant = () => {
    const variantLetter = String.fromCharCode(65 + variants.length - 1);
    setVariants([
      ...variants,
      {
        name: `Variant ${variantLetter}`,
        description: "",
        isControl: false,
        weight: 50,
      },
    ]);
  };

  const handleRemoveVariant = async (index: number) => {
    const variant = variants[index];
    if (variant.id) {
      await deleteVariant.mutateAsync({ variantId: variant.id });
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, updates: Partial<VariantForm>) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !experimentData) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-500">Experiment not found</p>
          <Link
            href={`/dashboard/${orgId}/experiments`}
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to experiments
          </Link>
        </div>
      </div>
    );
  }

  const experiment = experimentData.experiment;
  const isRunning = experiment.status === "running";
  const isPaused = experiment.status === "paused";
  const isCompleted = experiment.status === "completed";
  const isDraft = experiment.status === "draft";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/${orgId}/experiments`}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Edit Experiment</h1>
            <StatusBadge status={experiment.status} />
          </div>
          <p className="text-muted-foreground">
            {experiment.startedAt
              ? `Started ${new Date(experiment.startedAt).toLocaleDateString()}`
              : "Draft experiment"}
          </p>
        </div>
      </div>

      {/* Status Actions */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Experiment Status</h2>
        <div className="flex flex-wrap gap-3">
          {isDraft && (
            <button
              onClick={() => startExperiment.mutate({ experimentId })}
              disabled={startExperiment.isPending || variants.length < 2}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {startExperiment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start Experiment
            </button>
          )}
          {isRunning && (
            <button
              onClick={() => pauseExperiment.mutate({ experimentId })}
              disabled={pauseExperiment.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {pauseExperiment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
              Pause Experiment
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => startExperiment.mutate({ experimentId })}
              disabled={startExperiment.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {startExperiment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Resume Experiment
            </button>
          )}
          {(isRunning || isPaused) && (
            <button
              onClick={() => completeExperiment.mutate({ experimentId })}
              disabled={completeExperiment.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {completeExperiment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Complete Experiment
            </button>
          )}
        </div>
        {isDraft && variants.length < 2 && (
          <p className="text-xs text-muted-foreground mt-2">
            Add at least 2 variants to start the experiment
          </p>
        )}
      </div>

      {/* Results (if running or completed) */}
      {(isRunning || isCompleted || isPaused) && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Results</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Participants</span>
              </div>
              <p className="text-2xl font-bold">
                {experimentData.variants.reduce((sum, v) => sum + v.impressions, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Conversions</span>
              </div>
              <p className="text-2xl font-bold">
                {experimentData.variants.reduce((sum, v) => sum + v.conversions, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <span className="text-xs">Revenue</span>
              </div>
              <p className="text-2xl font-bold">
                ${experimentData.variants.reduce((sum, v) => sum + v.revenue, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Variant Results */}
          <div className="space-y-3">
            {experimentData.variants.map((v) => {
              const conversionRate =
                v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : "0";
              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{v.name}</span>
                    {v.isControl && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Control
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      {v.impressions} users
                    </span>
                    <span className="font-medium">{conversionRate}% conv.</span>
                    <span className="text-muted-foreground">${v.revenue.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {updateExperiment.error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          {updateExperiment.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Experiment Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Pricing Test Q1 2024"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
              disabled={isCompleted}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="What are you testing?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
              disabled={isCompleted}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hypothesis</label>
            <textarea
              value={formData.hypothesis}
              onChange={(e) =>
                setFormData((p) => ({ ...p, hypothesis: e.target.value }))
              }
              placeholder="We believe that... will result in..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
              disabled={isCompleted}
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Configuration</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Metric
              </label>
              <select
                value={formData.primaryMetric}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, primaryMetric: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                disabled={isRunning || isCompleted}
              >
                <option value="conversion_rate">Conversion Rate</option>
                <option value="revenue_per_user">Revenue per User</option>
                <option value="trial_conversion">Trial Conversion</option>
                <option value="ltv">Lifetime Value</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Traffic Allocation
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={10}
                  value={formData.trafficAllocation}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      trafficAllocation: Number(e.target.value),
                    }))
                  }
                  className="flex-1"
                  disabled={isCompleted}
                />
                <span className="text-sm font-medium w-12">
                  {formData.trafficAllocation}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variants</h2>
            {!isCompleted && (
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            )}
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id || index}
                className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) =>
                          handleUpdateVariant(index, { name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                        disabled={isCompleted}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Weight
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={variant.weight}
                        onChange={(e) =>
                          handleUpdateVariant(index, {
                            weight: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                        disabled={isRunning || isCompleted}
                      />
                    </div>
                  </div>

                  {!variant.isControl && variants.length > 2 && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      disabled={deleteVariant.isPending}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Offering (optional)
                  </label>
                  <select
                    value={variant.offeringId || ""}
                    onChange={(e) =>
                      handleUpdateVariant(index, {
                        offeringId: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                    disabled={isRunning || isCompleted}
                  >
                    <option value="">Use default offering</option>
                    {offerings?.map((offering) => (
                      <option key={offering.id} value={offering.id}>
                        {offering.displayName} {offering.isCurrent && "(default)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={variant.description}
                    onChange={(e) =>
                      handleUpdateVariant(index, { description: e.target.value })
                    }
                    placeholder="Describe this variant..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                    disabled={isCompleted}
                  />
                </div>

                {variant.isControl && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FlaskConical className="w-3 h-3" />
                    <span>Control group - baseline for comparison</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Total weight: {variants.reduce((sum, v) => sum + v.weight, 0)}. Users
            will be distributed proportionally based on weights.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Experiment
          </button>

          <div className="flex gap-3">
            <Link
              href={`/dashboard/${orgId}/experiments`}
              className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancel
            </Link>
            {!isCompleted && (
              <button
                type="submit"
                disabled={updateExperiment.isPending || !formData.name}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {updateExperiment.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-2">Delete Experiment?</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {experiment.name}
              </span>
              ? This action cannot be undone and all data will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteExperiment.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {deleteExperiment.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-500", icon: null },
    running: {
      bg: "bg-green-500/10",
      text: "text-green-500",
      icon: <Play className="w-3 h-3" />,
    },
    paused: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-500",
      icon: <Pause className="w-3 h-3" />,
    },
    completed: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };

  const c = config[status as keyof typeof config] || config.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}
    >
      {c.icon}
      {status}
    </span>
  );
}

