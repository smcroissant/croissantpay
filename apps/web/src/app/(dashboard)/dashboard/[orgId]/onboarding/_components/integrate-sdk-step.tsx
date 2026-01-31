"use client";

import {
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { marketingUrl } from "@/lib/config";

export function IntegrateSDKStep({ 
  copyToClipboard, 
  copiedCode 
}: { 
  copyToClipboard: (text: string, id: string) => void;
  copiedCode: string | null;
}) {
  const installCode = `npm install react-native-crp`;
  const configCode = `import { CroissantPay } from 'react-native-crp';

// Initialize in your app's entry point
CroissantPay.configure({
  apiKey: 'YOUR_PUBLIC_API_KEY',
});`;
  const usageCode = `import { usePurchases } from 'react-native-crp';

function SubscriptionScreen() {
  const { subscriberInfo, offerings, purchasePackage } = usePurchases();

  const handlePurchase = async (packageId: string) => {
    const pkg = offerings?.current?.availablePackages
      .find(p => p.identifier === packageId);
    
    if (pkg) {
      await purchasePackage(pkg);
    }
  };

  return (
    // Your paywall UI
  );
}`;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Add the CroissantPay SDK to your React Native app to handle purchases.
      </p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">1. Install the SDK</h4>
            <button
              onClick={() => copyToClipboard(installCode, "install")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedCode === "install" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copiedCode === "install" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-secondary/50 rounded-xl p-4 overflow-x-auto">
            <code className="text-sm">{installCode}</code>
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">2. Configure the SDK</h4>
            <button
              onClick={() => copyToClipboard(configCode, "config")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedCode === "config" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copiedCode === "config" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-secondary/50 rounded-xl p-4 overflow-x-auto">
            <code className="text-sm whitespace-pre">{configCode}</code>
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">3. Use in your components</h4>
            <button
              onClick={() => copyToClipboard(usageCode, "usage")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedCode === "usage" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copiedCode === "usage" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-secondary/50 rounded-xl p-4 overflow-x-auto max-h-64">
            <code className="text-sm whitespace-pre">{usageCode}</code>
          </pre>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <p className="text-sm text-green-400">
          <strong>🎉 You&apos;re all set!</strong> After completing these steps, you can start accepting payments in your app.
        </p>
      </div>

      <a
        href={`${marketingUrl()}/docs/sdk/react-native`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
      >
        View Full Documentation
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
