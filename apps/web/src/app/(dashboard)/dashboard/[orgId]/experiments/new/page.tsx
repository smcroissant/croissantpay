"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, FlaskConical } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface Variant {
  name: string;
  description: string;
  isControl: boolean;
  weight: number;
  offeringId?: string;
}

export default function NewExperimentPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [appId, setAppId] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState("conversion_rate");
  const [trafficAllocation, setTrafficAllocation] = useState(100);
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Control", description: "Original experience", isControl: true, weight: 50 },
    { name: "Variant A", description: "", isControl: false, weight: 50 },
  ]);

  const { data: apps, isLoading: loadingApps } = trpc.apps.list.useQuery();
  const { data: offerings } = trpc.products.listOfferings.useQuery();

  const createExperiment = trpc.experiments.create.useMutation();
  const createVariant = trpc.experiments.createVariant.useMutation();

  const handleAddVariant = () => {
    const variantLetter = String.fromCharCode(65 + variants.length - 1); // A, B, C...
    setVariants([
      ...variants,
      { name: `Variant ${variantLetter}`, description: "", isControl: false, weight: 50 },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 2) return; // Minimum 2 variants
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, updates: Partial<Variant>) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !appId) return;

    try {
      // Create the experiment
      const experiment = await createExperiment.mutateAsync({
        appId,
        name: name.trim(),
        description: description.trim() || undefined,
        hypothesis: hypothesis.trim() || undefined,
        primaryMetric,
        trafficAllocation,
      });

      // Create the variants
      for (const variant of variants) {
        await createVariant.mutateAsync({
          experimentId: experiment.id,
          name: variant.name,
          description: variant.description || undefined,
          isControl: variant.isControl,
          weight: variant.weight,
          offeringId: variant.offeringId,
        });
      }

      router.push(`/dashboard/${orgId}/experiments`);
    } catch (error) {
      console.error("Failed to create experiment:", error);
    }
  };

  const isSubmitting = createExperiment.isPending || createVariant.isPending;

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
        <div>
          <h1 className="text-2xl font-bold">Create Experiment</h1>
          <p className="text-muted-foreground">
            Set up an A/B test to optimize your offerings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">App *</label>
            {loadingApps ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading apps...
              </div>
            ) : (
              <select
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                required
              >
                <option value="">Select an app</option>
                {apps?.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Experiment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pricing Test Q1 2024"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you testing?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hypothesis</label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="We believe that... will result in..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
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
                value={primaryMetric}
                onChange={(e) => setPrimaryMetric(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
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
                  value={trafficAllocation}
                  onChange={(e) => setTrafficAllocation(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{trafficAllocation}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of users who will participate in the experiment
              </p>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Variants</h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
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
                          handleUpdateVariant(index, { weight: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {!variant.isControl && variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
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
            Total weight: {variants.reduce((sum, v) => sum + v.weight, 0)}. Users will be
            distributed proportionally based on weights.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/${orgId}/experiments`}
            className="px-6 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !appId}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Experiment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

