"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Smartphone,
  Apple,
  Package,
  Layers,
  Bell,
  Code,
  ArrowRight,
  ArrowLeft,
  Rocket,
  ClipboardCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

import {
  GooglePlayIcon,
  WelcomeStep,
  CreateAppStep,
  AppleSetupStep,
  GoogleSetupStep,
  CreateProductsStep,
  CreateOfferingsStep,
  WebhooksStep,
  VerifySetupStep,
  IntegrateSDKStep,
  type OnboardingStep,
} from "./_components";

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
    title: "Create Offerings",
    description: "Group your products into offerings for your paywall",
    icon: Layers,
  },
  {
    id: 6,
    title: "Configure Webhooks",
    description: "Set up real-time notifications from app stores",
    icon: Bell,
  },
  {
    id: 7,
    title: "Verify Setup",
    description: "Test your configuration and ensure everything works",
    icon: ClipboardCheck,
  },
  {
    id: 8,
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
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const router = useRouter();

  // tRPC queries
  const utils = trpc.useUtils();
  const { data: apps } = trpc.apps.list.useQuery();

  useEffect(() => {
    params.then((p) => setOrgId(p.orgId));
  }, [params]);

  // Auto-select first app if exists
  useEffect(() => {
    if (apps && apps.length > 0 && !createdAppId) {
      setCreatedAppId(apps[0].id);
    }
  }, [apps, createdAppId]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
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
    router.push(`/dashboard/${orgId}`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAppCreated = (appId: string) => {
    setCreatedAppId(appId);
    utils.apps.list.invalidate();
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <CreateAppStep onAppCreated={handleAppCreated} existingApps={apps || []} />;
      case 2:
        return <AppleSetupStep appId={createdAppId} />;
      case 3:
        return <GoogleSetupStep appId={createdAppId} />;
      case 4:
        return <CreateProductsStep appId={createdAppId} />;
      case 5:
        return <CreateOfferingsStep appId={createdAppId} />;
      case 6:
        return <WebhooksStep appId={createdAppId} copyToClipboard={copyToClipboard} copiedCode={copiedCode} />;
      case 7:
        return <VerifySetupStep appId={createdAppId} />;
      case 8:
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
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Complete Setup
                <Rocket className="w-4 h-4" />
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
