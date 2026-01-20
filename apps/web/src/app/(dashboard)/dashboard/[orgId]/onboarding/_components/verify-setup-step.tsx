"use client";

import { useState, useEffect } from "react";
import {
  Apple,
  Package,
  Bell,
  Code,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { GooglePlayIcon } from "@/components/app-setup";

export function VerifySetupStep({ appId }: { appId: string | null }) {
  const [testResult, setTestResult] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    details?: string;
  } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: app, isLoading: loadingApp } = trpc.apps.get.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  const { data: products, isLoading: loadingProducts } = trpc.products.listByApp.useQuery(
    { appId: appId! },
    { enabled: !!appId }
  );

  // Integration test status query with polling
  const { data: integrationStatus, refetch: refetchIntegrationStatus } = trpc.apps.getIntegrationTestStatus.useQuery(
    { appId: appId! },
    { 
      enabled: !!appId,
      refetchInterval: isPolling ? 3000 : false, // Poll every 3 seconds when waiting
    }
  );

  // Stop polling when we receive a test
  useEffect(() => {
    if (integrationStatus?.hasBeenTested && isPolling) {
      setIsPolling(false);
      setTestResult({
        type: "success",
        message: "🎉 SDK Integration Verified!",
        details: `Test received from ${integrationStatus.lastIntegrationTestPlatform} at ${new Date(integrationStatus.lastIntegrationTest!).toLocaleString()}`,
      });
    }
  }, [integrationStatus, isPolling]);

  const testConnection = trpc.products.testAppStoreConnection.useMutation({
    onSuccess: (result) => {
      if (result.appFound) {
        setTestResult({
          type: "success",
          message: "Apple App Store Connected!",
          details: result.message,
        });
      } else {
        setTestResult({
          type: "warning",
          message: "Connected, but app not found",
          details: result.message,
        });
      }
    },
    onError: (error) => {
      setTestResult({
        type: "error",
        message: "Connection Failed",
        details: error.message,
      });
    },
  });

  const handleTestApple = () => {
    if (!appId) return;
    setTestResult(null);
    testConnection.mutate({ appId });
  };

  const startWaitingForSDKTest = () => {
    setIsPolling(true);
    setTestResult({
      type: "warning",
      message: "Waiting for SDK test...",
      details: "Run CroissantPay.testIntegration() in your app. We'll detect it automatically.",
    });
  };

  const stopWaitingForSDKTest = () => {
    setIsPolling(false);
    setTestResult(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!appId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Please create an app first in step 1.</p>
      </div>
    );
  }

  if (loadingApp || loadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Configuration checks
  const hasApp = !!app;
  const hasAppleConfig = !!(app?.bundleId && app?.appleKeyId && app?.appleIssuerId && app?.applePrivateKey);
  const hasGoogleConfig = !!(app?.packageName && app?.googleServiceAccount);
  const hasProducts = (products?.length || 0) > 0;
  const hasWebhooks = !!(app?.appleWebhookId && app?.googleWebhookId);
  const hasSDKIntegration = integrationStatus?.hasBeenTested || false;
  const productCount = products?.length || 0;

  // Calculate overall readiness
  const requiredChecks = [hasApp, hasProducts];
  const optionalChecks = [hasAppleConfig, hasGoogleConfig];
  const passedRequired = requiredChecks.filter(Boolean).length;
  const passedOptional = optionalChecks.filter(Boolean).length;
  const isReady = passedRequired === requiredChecks.length && passedOptional >= 1;

  // SDK Test code
  const sdkTestCode = `import { CroissantPay } from 'react-native-crp';

// After configuring the SDK, run:
const result = await CroissantPay.testIntegration();
console.log(result);
// { success: true, message: "Integration test successful!" }`;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Let&apos;s verify your configuration before you start integrating the SDK. 
        This will help identify any issues early.
      </p>

      {/* Overall Status */}
      <div className={`p-4 rounded-xl border ${
        isReady 
          ? "bg-green-500/10 border-green-500/20" 
          : "bg-yellow-500/10 border-yellow-500/20"
      }`}>
        <div className="flex items-center gap-3">
          {isReady ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          )}
          <div>
            <p className={`font-medium ${isReady ? "text-green-400" : "text-yellow-400"}`}>
              {isReady ? "Your setup looks good!" : "Some configuration is missing"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isReady 
                ? "You're ready to integrate the SDK into your app." 
                : "Review the checklist below and complete the required items."}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Checklist */}
      <div className="space-y-3">
        <h4 className="font-medium">Configuration Checklist</h4>
        
        {/* App Created */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasApp ? "bg-green-500/5 border border-green-500/20" : "bg-red-500/5 border border-red-500/20"
        }`}>
          {hasApp ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">App Created</p>
            {hasApp && (
              <p className="text-sm text-muted-foreground">
                {app?.name} • {app?.bundleId || app?.packageName || "No identifier set"}
              </p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded ${hasApp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            Required
          </span>
        </div>

        {/* Apple Configuration */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasAppleConfig ? "bg-green-500/5 border border-green-500/20" : "bg-secondary/30 border border-border"
        }`}>
          {hasAppleConfig ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              <p className="font-medium">Apple App Store Connect</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasAppleConfig 
                ? `Configured with Bundle ID: ${app?.bundleId}`
                : "Not configured - required for iOS in-app purchases"}
            </p>
          </div>
          {hasAppleConfig && (
            <button
              onClick={handleTestApple}
              disabled={testConnection.isPending}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
            >
              {testConnection.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Test
            </button>
          )}
        </div>

        {/* Google Configuration */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasGoogleConfig ? "bg-green-500/5 border border-green-500/20" : "bg-secondary/30 border border-border"
        }`}>
          {hasGoogleConfig ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GooglePlayIcon className="w-4 h-4" />
              <p className="font-medium">Google Play Console</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasGoogleConfig 
                ? `Configured with Package: ${app?.packageName}`
                : "Not configured - required for Android in-app purchases"}
            </p>
          </div>
        </div>

        {/* Products Created */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasProducts ? "bg-green-500/5 border border-green-500/20" : "bg-red-500/5 border border-red-500/20"
        }`}>
          {hasProducts ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <p className="font-medium">Products Created</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasProducts 
                ? `${productCount} product${productCount > 1 ? "s" : ""} configured`
                : "No products yet - create at least one product to sell"}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${hasProducts ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            Required
          </span>
        </div>

        {/* Webhooks */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasWebhooks ? "bg-green-500/5 border border-green-500/20" : "bg-secondary/30 border border-border"
        }`}>
          {hasWebhooks ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <p className="font-medium">Webhook URLs Generated</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasWebhooks 
                ? "URLs ready - make sure to configure them in App Store Connect & Play Console"
                : "Webhook URLs will be generated automatically"}
            </p>
          </div>
        </div>

        {/* SDK Integration Test */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          hasSDKIntegration ? "bg-green-500/5 border border-green-500/20" : "bg-secondary/30 border border-border"
        }`}>
          {hasSDKIntegration ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : isPolling ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <p className="font-medium">SDK Integration Verified</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSDKIntegration 
                ? `Last tested: ${integrationStatus?.lastIntegrationTestPlatform} • ${new Date(integrationStatus?.lastIntegrationTest!).toLocaleString()}`
                : isPolling
                ? "Waiting for test request from your app..."
                : "Run testIntegration() from the SDK to verify the connection"}
            </p>
          </div>
          {!hasSDKIntegration && !isPolling && (
            <button
              onClick={startWaitingForSDKTest}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Wait for Test
            </button>
          )}
          {isPolling && (
            <button
              onClick={stopWaitingForSDKTest}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
          {hasSDKIntegration && (
            <button
              onClick={() => refetchIntegrationStatus()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* SDK Test Instructions */}
      {!hasSDKIntegration && (
        <div className="bg-secondary/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Code className="w-5 h-5 text-primary" />
            <h4 className="font-medium">Test SDK Integration</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            After installing and configuring the SDK in your app, run this code to verify the integration:
          </p>
          <div className="relative">
            <pre className="p-4 rounded-lg bg-background border border-border text-sm overflow-x-auto">
              <code>{sdkTestCode}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(sdkTestCode, "sdk-test")}
              className="absolute top-2 right-2 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {copiedCode === "sdk-test" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click &quot;Wait for Test&quot; above, then run the code in your app. We&apos;ll detect it automatically.
          </p>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          testResult.type === "success"
            ? "bg-green-500/10 border border-green-500/20"
            : testResult.type === "warning"
            ? "bg-yellow-500/10 border border-yellow-500/20"
            : "bg-red-500/10 border border-red-500/20"
        }`}>
          {testResult.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          ) : testResult.type === "warning" ? (
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${
              testResult.type === "success" 
                ? "text-green-400" 
                : testResult.type === "warning"
                ? "text-yellow-400"
                : "text-red-400"
            }`}>
              {testResult.message}
            </p>
            {testResult.details && (
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {testResult.details}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="p-1 hover:bg-background rounded flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>💡 Tips:</strong>
        </p>
        <ul className="text-sm text-blue-400/80 mt-2 space-y-1 list-disc list-inside">
          <li>You need at least one store configured (Apple or Google) to process payments</li>
          <li>Products must match exactly what you&apos;ve created in App Store Connect / Play Console</li>
          <li>Webhooks are essential for handling subscription renewals and cancellations</li>
        </ul>
      </div>
    </div>
  );
}
