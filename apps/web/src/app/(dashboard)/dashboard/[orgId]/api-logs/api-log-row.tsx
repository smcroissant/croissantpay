"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
} from "lucide-react";

interface ApiLog {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query: Record<string, string> | null;
  headers: Record<string, string> | null;
  body: Record<string, unknown> | null;
  statusCode: number;
  responseBody: Record<string, unknown> | null;
  responseTime: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  apiKeyType: string | null;
  apiKeyPrefix: string | null;
  subscriberId: string | null;
  appUserId: string | null;
  errorMessage: string | null;
  createdAt: Date | string;
  appId: string | null;
  appName: string | null;
}

export function ApiLogRow({ log }: { log: ApiLog }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const methodColors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-500",
    POST: "bg-green-500/10 text-green-500",
    PUT: "bg-yellow-500/10 text-yellow-500",
    PATCH: "bg-orange-500/10 text-orange-500",
    DELETE: "bg-red-500/10 text-red-500",
  };

  const statusColor =
    log.statusCode < 300
      ? "bg-green-500/10 text-green-500"
      : log.statusCode < 400
      ? "bg-blue-500/10 text-blue-500"
      : log.statusCode < 500
      ? "bg-yellow-500/10 text-yellow-500"
      : "bg-red-500/10 text-red-500";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      <tr
        className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <td className="px-6 py-4">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${
              methodColors[log.method]
            }`}
          >
            {log.method}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="font-mono text-sm">{log.path}</span>
          {log.query && Object.keys(log.query).length > 0 && (
            <span className="text-muted-foreground text-xs ml-2">
              ?{Object.keys(log.query).length} params
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusColor}`}
          >
            {log.statusCode}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm">{log.appName || "-"}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {log.responseTime ? `${log.responseTime}ms` : "-"}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">
          {new Date(log.createdAt).toLocaleString()}
        </td>
      </tr>

      {/* Expanded Details */}
      {isExpanded && (
        <tr className="bg-secondary/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Request Details */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-blue-500" />
                  Request
                </h4>

                {/* URL */}
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Full URL
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-background px-3 py-2 rounded-lg flex-1 overflow-auto">
                      {log.path}
                      {log.query && Object.keys(log.query).length > 0
                        ? "?" +
                          Object.entries(log.query)
                            .map(([k, v]) => `${k}=${v}`)
                            .join("&")
                        : ""}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(log.path, "url");
                      }}
                      className="p-2 hover:bg-background rounded-lg"
                    >
                      {copiedField === "url" ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Headers */}
                {log.headers && Object.keys(log.headers).length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Headers
                    </label>
                    <pre className="text-xs bg-background px-3 py-2 rounded-lg mt-1 overflow-auto max-h-40">
                      {JSON.stringify(log.headers, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Request Body */}
                {log.body && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Request Body
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(JSON.stringify(log.body, null, 2), "body");
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        {copiedField === "body" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs bg-background px-3 py-2 rounded-lg mt-1 overflow-auto max-h-60">
                      {JSON.stringify(log.body, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      IP Address
                    </label>
                    <p className="text-sm mt-1 font-mono">
                      {log.ipAddress || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      API Key
                    </label>
                    <p className="text-sm mt-1 font-mono">
                      {log.apiKeyType
                        ? `${log.apiKeyType} (${log.apiKeyPrefix}...)`
                        : "-"}
                    </p>
                  </div>
                  {log.appUserId && (
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        App User ID
                      </label>
                      <p className="text-sm mt-1 font-mono">{log.appUserId}</p>
                    </div>
                  )}
                  {log.userAgent && (
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        User Agent
                      </label>
                      <p className="text-xs mt-1 text-muted-foreground truncate">
                        {log.userAgent}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Response Details */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  Response
                </h4>

                {/* Status */}
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Status Code
                    </label>
                    <p className="mt-1">
                      <span className={`px-2.5 py-1 rounded-md text-sm font-medium ${statusColor}`}>
                        {log.statusCode}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Duration
                    </label>
                    <p className="text-sm mt-1">
                      {log.responseTime ? `${log.responseTime}ms` : "-"}
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {log.errorMessage && (
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Error Message
                    </label>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-1">
                      <p className="text-sm text-red-500">{log.errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Response Body */}
                {log.responseBody && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Response Body
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(
                            JSON.stringify(log.responseBody, null, 2),
                            "response"
                          );
                        }}
                        className="p-1 hover:bg-background rounded"
                      >
                        {copiedField === "response" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs bg-background px-3 py-2 rounded-lg mt-1 overflow-auto max-h-60">
                      {JSON.stringify(log.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
