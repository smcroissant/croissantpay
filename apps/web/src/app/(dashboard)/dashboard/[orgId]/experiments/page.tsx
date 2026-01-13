import Link from "next/link";
import { FlaskConical, Plus, Users, TrendingUp, Pause, Play, CheckCircle } from "lucide-react";
import { fetchExperiments } from "@/app/actions/dashboard";

export default async function ExperimentsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const experiments = await fetchExperiments();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A/B Testing</h1>
          <p className="text-muted-foreground">
            Run experiments to optimize your offerings and conversions
          </p>
        </div>
        <Link
          href={`/dashboard/${orgId}/experiments/new`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Experiment</span>
        </Link>
      </div>

      {/* Experiments */}
      {!experiments || experiments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No experiments yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create A/B tests to experiment with different offerings, pricing, and paywalls.
          </p>
          <Link
            href={`/dashboard/${orgId}/experiments/new`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Experiment</span>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/dashboard/${orgId}/experiments/${experiment.id}/edit`}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-purple-500" />
                </div>
                <StatusBadge status={experiment.status} />
              </div>

              <h3 className="font-semibold text-lg mb-1">{experiment.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {experiment.description || "No description"}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{experiment.participantCount || 0} participants</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>{experiment.conversionRate || 0}% conversion</span>
                </div>
              </div>

              {/* Variants Preview */}
              {experiment.variants && experiment.variants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Variants</p>
                  <div className="flex gap-2">
                    {experiment.variants.slice(0, 3).map((variant, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full bg-secondary text-xs"
                      >
                        {variant.name}
                      </span>
                    ))}
                    {experiment.variants.length > 3 && (
                      <span className="px-2 py-1 rounded-full bg-secondary text-xs">
                        +{experiment.variants.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Link>
          ))}
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

