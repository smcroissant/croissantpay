import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { CroissantPay } from "./CroissantPay";
import type {
  CroissantPayConfig,
  SubscriberInfo,
  Offerings,
  PurchaseResult,
  RestoreResult,
} from "./types";

interface CroissantPayContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  subscriberInfo: SubscriberInfo | null;
  offerings: Offerings | null;
  error: Error | null;
  identify: (appUserId: string) => Promise<SubscriberInfo | null>;
  purchase: (productIdentifier: string) => Promise<PurchaseResult | null>;
  restore: () => Promise<RestoreResult | null>;
  refresh: () => Promise<void>;
  hasEntitlement: (entitlementId: string) => boolean;
}

const CroissantPayContext = createContext<CroissantPayContextValue | null>(null);

interface CroissantPayProviderProps {
  config: CroissantPayConfig;
  children: React.ReactNode;
  onConfigured?: () => void;
  onError?: (error: Error) => void;
}

export function CroissantPayProvider({
  config,
  children,
  onConfigured,
  onError,
}: CroissantPayProviderProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriberInfo, setSubscriberInfo] = useState<SubscriberInfo | null>(
    null
  );
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize SDK
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await CroissantPay.configure(config);
        setIsConfigured(true);

        // Fetch offerings
        const fetchedOfferings = await CroissantPay.getOfferings();
        setOfferings(fetchedOfferings);

        // If user ID provided, get subscriber info
        if (config.appUserId) {
          const info = await CroissantPay.getSubscriberInfo();
          setSubscriberInfo(info);
        }

        onConfigured?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [config.apiKey, config.apiUrl, config.appUserId]);

  const identify = useCallback(async (appUserId: string) => {
    try {
      setIsLoading(true);
      const info = await CroissantPay.identify(appUserId);
      setSubscriberInfo(info);
      return info;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = useCallback(async (productIdentifier: string) => {
    try {
      setIsLoading(true);
      const result = await CroissantPay.purchase(productIdentifier);
      if (result.success) {
        setSubscriberInfo(result.subscriberInfo);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await CroissantPay.restorePurchases();
      if (result.success) {
        setSubscriberInfo(result.subscriberInfo);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [newOfferings, newSubscriberInfo] = await Promise.all([
        CroissantPay.getOfferings(),
        CroissantPay.getSubscriberInfo(),
      ]);
      setOfferings(newOfferings);
      setSubscriberInfo(newSubscriberInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasEntitlement = useCallback(
    (entitlementId: string) => {
      return CroissantPay.hasActiveEntitlement(entitlementId);
    },
    [subscriberInfo]
  );

  const value = useMemo(
    () => ({
      isConfigured,
      isLoading,
      subscriberInfo,
      offerings,
      error,
      identify,
      purchase,
      restore,
      refresh,
      hasEntitlement,
    }),
    [
      isConfigured,
      isLoading,
      subscriberInfo,
      offerings,
      error,
      identify,
      purchase,
      restore,
      refresh,
      hasEntitlement,
    ]
  );

  return (
    <CroissantPayContext.Provider value={value}>{children}</CroissantPayContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(CroissantPayContext);

  if (!context) {
    throw new Error("usePurchases must be used within a CroissantPayProvider");
  }

  return context;
}

// Hook for checking specific entitlements
export function useEntitlement(entitlementId: string) {
  const { subscriberInfo, isLoading } = usePurchases();

  const entitlement = subscriberInfo?.entitlements[entitlementId] ?? null;
  const isActive = entitlement?.isActive ?? false;

  return {
    entitlement,
    isActive,
    isLoading,
  };
}

// Hook for getting current offering
export function useCurrentOffering() {
  const { offerings, isLoading } = usePurchases();

  const currentOffering = offerings?.currentOfferingId
    ? offerings.offerings[offerings.currentOfferingId]
    : null;

  return {
    offering: currentOffering,
    isLoading,
  };
}

// Alias for usePurchases (for API compatibility)
export const useCroissantPay = usePurchases;

