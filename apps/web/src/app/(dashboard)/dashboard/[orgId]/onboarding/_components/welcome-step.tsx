"use client";

import {
  Sparkles,
  Smartphone,
  Bell,
  Code,
  CheckCircle,
} from "lucide-react";

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

export function WelcomeStep() {
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
