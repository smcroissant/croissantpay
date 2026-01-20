"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Smartphone,
  Apple,
  Key,
  Package,
  Bell,
  Code,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Rocket,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

// Google Play icon
function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  );
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: OnboardingStep[] = [
  {
    id: 0,
    title: "Welcome to CroissantPay",
    description: "Let's get you set up to start monetizing your app",
    icon: Sparkles,
  },
  {
    id: 1,
    title: "Create Your App",
    description: "Add your iOS or Android app to get started",
    icon: Smartphone,
  },
  {
    id: 2,
    title: "Apple App Store Setup",
    description: "Connect to Apple for iOS in-app purchases",
    icon: Apple,
  },
  {
    id: 3,
    title: "Google Play Setup",
    description: "Connect to Google for Android in-app purchases",
    icon: GooglePlayIcon,
  },
  {
    id: 4,
    title: "Create Products",
    description: "Set up your subscription plans or one-time purchases",
    icon: Package,
  },
  {
    id: 5,
    title: "Configure Webhooks",
    description: "Set up real-time notifications from app stores",
    icon: Bell,
  },
  {
    id: 6,
    title: "Integrate SDK",
    description: "Add CroissantPay to your mobile app",
    icon: Code,
  },
];

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const [orgId, setOrgId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();

  // tRPC mutations
  const updateProgressMutation = trpc.organizations.updateOnboardingProgress.useMutation();
  const completeOnboardingMutation = trpc.organizations.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/${orgId}`);
    },
  });

  useEffect(() => {
    params.then((p) => setOrgId(p.orgId));
  }, [params]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Save progress
      updateProgressMutation.mutate({ step: nextStep });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CreateAppStep orgId={orgId} />;
      case 2:
        return <AppleSetupStep />;
      case 3:
        return <GoogleSetupStep />;
      case 4:
        return <CreateProductsStep orgId={orgId} />;
      case 5:
        return <WebhooksStep orgId={orgId} />;
      case 6:
        return <IntegrateSDKStep copyToClipboard={copyToClipboard} copiedCode={copiedCode} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Progress Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">Setup Guide</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                    ? "bg-primary"
                    : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Step Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            {(() => {
              const StepIcon = STEPS[currentStep].icon;
              return <StepIcon className="w-7 h-7 text-primary" />;
            })()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{STEPS[currentStep].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            )}
            
            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={completeOnboardingMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {completeOnboardingMutation.isPending ? (
                  "Completing..."
                ) : (
                  <>
                    Complete Setup
                    <Rocket className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components

function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Welcome aboard! 🥐</h3>
        <p className="text-muted-foreground max-w-lg mx-auto">
          CroissantPay helps you manage in-app purchases and subscriptions across iOS and Android.
          Let&apos;s set up everything you need to start monetizing your app.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <FeatureCard
          icon={Smartphone}
          title="Multi-Platform"
          description="Support iOS App Store and Google Play from one dashboard"
        />
        <FeatureCard
          icon={Bell}
          title="Real-time Sync"
          description="Webhooks keep your data in sync with app stores"
        />
        <FeatureCard
          icon={Code}
          title="Easy Integration"
          description="Simple SDK for React Native, iOS, and Android"
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
        <h4 className="font-medium mb-2">What we&apos;ll set up:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Create your app configuration
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Connect to Apple App Store and Google Play
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Set up products and subscription plans
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Configure webhooks for real-time updates
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Integrate the SDK in your app
          </li>
        </ul>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-secondary/50">
      <Icon className="w-6 h-6 text-primary mb-2" />
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CreateAppStep({ orgId }: { orgId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        First, create an app in CroissantPay. This will be linked to your iOS and/or Android app.
      </p>

      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-xl p-6">
          <h4 className="font-medium mb-4">What you&apos;ll need:</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium">App Name</p>
                <p className="text-sm text-muted-foreground">A friendly name for your app (e.g., &quot;My Awesome App&quot;)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium">iOS Bundle ID (optional)</p>
                <p className="text-sm text-muted-foreground">Found in Xcode → Your Target → General → Bundle Identifier</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block">com.yourcompany.yourapp</code>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium">Android Package Name (optional)</p>
                <p className="text-sm text-muted-foreground">Found in android/app/build.gradle → applicationId</p>
                <code className="text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block">com.yourcompany.yourapp</code>
              </div>
            </li>
          </ul>
        </div>

        <a
          href={`/dashboard/${orgId}/apps/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create App
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> You can create one app that supports both iOS and Android, or create separate apps for each platform.
        </p>
      </div>
    </div>
  );
}

function AppleSetupStep() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Connect your app to Apple App Store Connect to enable iOS in-app purchases.
      </p>

      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-xl p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Apple className="w-5 h-5" />
            Required Credentials from App Store Connect
          </h4>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium">Issuer ID</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Go to <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">App Store Connect → Users and Access → Integrations → App Store Connect API</a>
                </p>
                <p className="text-sm text-muted-foreground">Copy the &quot;Issuer ID&quot; shown at the top of the page</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium">Key ID & Private Key (.p8)</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Click &quot;Generate API Key&quot; → Choose &quot;In-App Purchase&quot; access → Download the .p8 file
                </p>
                <p className="text-sm text-muted-foreground">The Key ID will be shown in the list after creation</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium">Shared Secret (Legacy apps only)</p>
                <p className="text-sm text-muted-foreground">
                  Found in your app → In-App Purchases → App-Specific Shared Secret
                </p>
              </div>
            </li>
          </ol>
        </div>

        <a
          href="https://appstoreconnect.apple.com/access/integrations/api"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <Apple className="w-5 h-5" />
          Open App Store Connect
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
        <p className="text-sm text-orange-400">
          <strong>Important:</strong> Store your .p8 private key safely! Apple only lets you download it once. 
          You&apos;ll paste the contents in your app settings.
        </p>
      </div>
    </div>
  );
}

function GoogleSetupStep() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Connect your app to Google Play Console to enable Android in-app purchases.
      </p>

      <div className="space-y-4">
        <div className="bg-secondary/30 rounded-xl p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <GooglePlayIcon className="w-5 h-5" />
            Required: Service Account JSON
          </h4>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <p className="font-medium">Create a Service Account</p>
                <p className="text-sm text-muted-foreground">
                  Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console → IAM → Service Accounts</a>
                </p>
                <p className="text-sm text-muted-foreground">Create a new service account with a descriptive name</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <p className="font-medium">Download JSON Key</p>
                <p className="text-sm text-muted-foreground">
                  Click on the service account → Keys tab → Add Key → Create new key → JSON
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <p className="font-medium">Link to Google Play Console</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Go to <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Play Console</a> → Settings → API access
                </p>
                <p className="text-sm text-muted-foreground">Link your Google Cloud project and grant the service account permissions</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex gap-3">
          <a
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Google Cloud Console
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Play Console
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> It can take up to 24 hours for service account permissions to propagate in Google Play Console.
        </p>
      </div>
    </div>
  );
}

function CreateProductsStep({ orgId }: { orgId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Create products in CroissantPay that map to your in-app purchases in the App Store and Play Store.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-secondary/30 rounded-xl p-5">
          <Package className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-medium mb-2">Subscriptions</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Auto-renewing subscriptions with weekly, monthly, or yearly billing periods.
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Free trials</li>
            <li>• Introductory prices</li>
            <li>• Subscription groups</li>
          </ul>
        </div>
        <div className="bg-secondary/30 rounded-xl p-5">
          <Key className="w-8 h-8 text-primary mb-3" />
          <h4 className="font-medium mb-2">One-Time Purchases</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Consumables and non-consumables for one-time unlocks.
          </p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Lifetime access</li>
            <li>• Coin packs</li>
            <li>• Premium features</li>
          </ul>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-xl p-6">
        <h4 className="font-medium mb-4">Before creating products:</h4>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-sm">Create your products in <strong>App Store Connect</strong> and/or <strong>Google Play Console</strong> first</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-sm">Note down the <strong>Product IDs</strong> you created (e.g., <code className="bg-secondary px-1 rounded">premium_monthly</code>)</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-sm">Create matching products in CroissantPay using those same Product IDs</p>
            </div>
          </li>
        </ol>
      </div>

      <a
        href={`/dashboard/${orgId}/products/new`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Create Product
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

function WebhooksStep({ orgId }: { orgId: string }) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Webhooks are <strong>essential</strong> for keeping your subscription data in sync. They notify you when users subscribe, renew, cancel, or get refunded.
      </p>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-sm text-yellow-400">
          <strong>⚠️ Important:</strong> Without webhooks, subscription changes made outside your app (like cancellations from iOS Settings) won&apos;t be reflected in your system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-secondary/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-6 h-6" />
            <h4 className="font-medium">Apple App Store</h4>
          </div>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>1. Go to App Store Connect → Your App</li>
            <li>2. Navigate to App Information</li>
            <li>3. Find &quot;App Store Server Notifications&quot;</li>
            <li>4. Paste your webhook URL</li>
            <li>5. Select &quot;Version 2 Notifications&quot;</li>
          </ol>
        </div>
        <div className="bg-secondary/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <GooglePlayIcon className="w-6 h-6" />
            <h4 className="font-medium">Google Play</h4>
          </div>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li>1. Create a Pub/Sub topic in Google Cloud</li>
            <li>2. Create a push subscription with your URL</li>
            <li>3. Go to Play Console → Monetization</li>
            <li>4. Enter your Pub/Sub topic name</li>
          </ol>
        </div>
      </div>

      <a
        href={`/dashboard/${orgId}/webhooks`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        View Webhook URLs
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

function IntegrateSDKStep({ 
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
        href="/docs/sdk/react-native"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
      >
        View Full Documentation
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

