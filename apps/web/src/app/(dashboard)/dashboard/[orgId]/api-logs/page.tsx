"use client";

import { useState } from "react";
import {
  ScrollText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TestTube2,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ApiLogRow } from "./api-log-row";

export default function ApiLogsPage() {
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const utils = trpc.useUtils();

  // Fetch apps for filter dropdown
  const { data: appsData } = trpc.apps.list.useQuery();
  const apps = appsData || [];

  // Fetch logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = trpc.apiLogs.list.useQuery({
    appId: selectedAppId || undefined,
    method: selectedMethod as any || undefined,
  });

  // Fetch stats
  const { data: stats } = trpc.apiLogs.stats.useQuery();

  // Test log mutation
  const createTestLogMutation = trpc.apiLogs.createTestLog.useMutation({
    onSuccess: () => {
      utils.apiLogs.list.invalidate();
      utils.apiLogs.stats.invalidate();
    },
  });

  // Clear logs mutation
  const clearLogsMutation = trpc.apiLogs.clearLogs.useMutation({
    onSuccess: () => {
      utils.apiLogs.list.invalidate();
      utils.apiLogs.stats.invalidate();
    },
  });

  const logs = logsData?.logs || [];
  const totalRequests = stats?.total || 0;
  const successRequests = stats?.success || 0;
  const clientErrors = stats?.clientErrors || 0;
  const serverErrors = stats?.serverErrors || 0;
  const avgResponseTime = stats?.avgResponseTime || 0;

  const handleTestLog = async () => {
    await createTestLogMutation.mutateAsync();
  };

  const handleClearLogs = async () => {
    if (confirm("Are you sure you want to clear all API logs? This cannot be undone.")) {
      await clearLogsMutation.mutateAsync();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Logs</h1>
          <p className="text-muted-foreground">
            Monitor all API requests made to your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-4 py-2 rounded-xl bg-secondary border-none text-sm"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
          >
            <option value="">All Apps</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 rounded-xl bg-secondary border-none text-sm"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Requests"
          value={totalRequests.toString()}
          icon={ScrollText}
        />
        <StatCard
          label="Successful"
          value={successRequests.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Client Errors"
          value={clientErrors.toString()}
          icon={XCircle}
          color="yellow"
        />
        <StatCard
          label="Server Errors"
          value={serverErrors.toString()}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Avg Response"
          value={`${avgResponseTime}ms`}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-500">Error loading logs: {error.message}</p>
        </div>
      )}

      {/* Logs Table */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No API logs yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            API requests to your apps will be logged here. Start by making
            requests using your API keys.
          </p>
          
          {/* Test Button */}
          <button
            onClick={handleTestLog}
            disabled={createTestLogMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors mb-6"
          >
            <TestTube2 className="w-4 h-4" />
            {createTestLogMutation.isPending ? "Creating..." : "Create Test Log"}
          </button>

          {createTestLogMutation.isSuccess && (
            <p className="text-green-500 text-sm mb-4">
              ✓ Test log created! Refresh to see it.
            </p>
          )}

          {createTestLogMutation.error && (
            <p className="text-red-500 text-sm mb-4">
              Error: {createTestLogMutation.error.message}
            </p>
          )}

          <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left max-w-lg mx-auto">
            <p className="text-sm font-medium text-blue-400 mb-2">How to use with your app:</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to your app settings and copy your Public API key</li>
              <li>
                Make a request to the API, for example:
                <pre className="mt-2 p-2 rounded bg-black/20 text-xs overflow-x-auto">
{`curl -H "Authorization: Bearer mx_public_xxx" \\
     https://your-domain.com/api/v1/offerings`}
                </pre>
              </li>
              <li>The request will be logged here automatically</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Actions bar */}
          <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
            <span className="text-sm text-muted-foreground">
              Showing {logs.length} of {logsData?.total || 0} logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestLog}
                disabled={createTestLogMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <TestTube2 className="w-3.5 h-3.5" />
                Test Log
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearLogsMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground w-8"></th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Method
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Path
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  App
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <ApiLogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "green" | "red" | "yellow" | "blue";
}) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
    yellow: "bg-yellow-500/10 text-yellow-500",
    blue: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            color ? colorClasses[color] : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
