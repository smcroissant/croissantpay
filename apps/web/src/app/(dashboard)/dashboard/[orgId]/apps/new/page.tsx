"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Apple,
  Package,
  Layers,
  Bell,
  Code,
  Rocket,
  ClipboardCheck,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import {
  CreateAppForm,
  AppleSetupForm,
  GoogleSetupForm,
  GooglePlayIcon,
} from "@/components/app-setup";
import {
  CreateProductsStep,
  CreateOfferingsStep,
  WebhooksStep,
  VerifySetupStep,
  IntegrateSDKStep,
} from "../../onboarding/_components";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    id: 0,
    title: "Create Your App",
    description: "Add your iOS or Android app to get started",
    icon: Smartphone,
  },
  {
    id: 1,
    title: "Apple App Store Setup",
    description: "Connect to Apple for iOS in-app purchases",
    icon: Apple,
  },
  {
    id: 2,
    title: "Google Play Setup",
    description: "Connect to Google for Android in-app purchases",
    icon: GooglePlayIcon,
  },
  {
    id: 3,
    title: "Create Products",
    description: "Set up your subscription plans or one-time purchases",
    icon: Package,
  },
  {
    id: 4,
    title: "Create Offerings",
    description: "Group your products into offerings for your paywall",
    icon: Layers,
  },
  {
    id: 5,
    title: "Configure Webhooks",
    description: "Set up real-time notifications from app stores",
    icon: Bell,
  },
  {
    id: 6,
    title: "Verify Setup",
    description: "Test your configuration and ensure everything works",
    icon: ClipboardCheck,
  },
  {
    id: 7,
    title: "Integrate SDK",
    description: "Add CroissantPay to your mobile app",
    icon: Code,
  },
];

export default function NewAppPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const handleAppCreated = (appId: string) => {
    setCreatedAppId(appId);
    utils.apps.list.invalidate();
    handleNext();
  };

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
    router.push(`/dashboard/${orgId}/apps`);
    router.refresh();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreateAppForm
            onAppCreated={handleAppCreated}
            showExistingApps={false}
          />
        );
      case 1:
        return (
          <AppleSetupForm
            appId={createdAppId}
            showSuccessMessage={false}
            onSaved={handleNext}
          />
        );
      case 2:
        return (
          <GoogleSetupForm
            appId={createdAppId}
            showSuccessMessage={false}
            onSaved={handleNext}
          />
        );
      case 3:
        return <CreateProductsStep appId={createdAppId} />;
      case 4:
        return <CreateOfferingsStep appId={createdAppId} />;
      case 5:
        return (
          <WebhooksStep
            appId={createdAppId}
            copyToClipboard={copyToClipboard}
            copiedCode={copiedCode}
          />
        );
      case 6:
        return <VerifySetupStep appId={createdAppId} />;
      case 7:
        return (
          <IntegrateSDKStep
            copyToClipboard={copyToClipboard}
            copiedCode={copiedCode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-6">
        <Link
          href={`/dashboard/${orgId}/apps`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Apps</span>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 mt-6">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">Create New App</h1>
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
            <p className="text-muted-foreground">
              {STEPS[currentStep].description}
            </p>
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
            ) : currentStep === 0 ? null : (
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
