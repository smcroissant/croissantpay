import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { usePurchases } from "@croissantpay/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, purchaseProduct, restorePurchases, isLoading } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [purchasing, setPurchasing] = useState(false);

  // Demo pricing data - in production, this comes from offerings
  const plans = {
    monthly: {
      identifier: "pro_monthly",
      price: "$9.99",
      period: "month",
      product: offerings?.current?.packages?.find((p: any) =>
        p.identifier?.includes("monthly")
      )?.product,
    },
    yearly: {
      identifier: "pro_yearly",
      price: "$99.99",
      originalPrice: "$119.88",
      savings: "Save 17%",
      period: "year",
      product: offerings?.current?.packages?.find((p: any) =>
        p.identifier?.includes("yearly")
      )?.product,
    },
  };

  const handlePurchase = async () => {
    const plan = plans[selectedPlan];
    setPurchasing(true);

    try {
      if (plan.product) {
        await purchaseProduct(plan.product);
      } else {
        // Demo mode
        Alert.alert(
          "Demo Mode",
          "In production, this would initiate the purchase flow with the App Store / Play Store."
        );
      }
      router.back();
    } catch (err: any) {
      if (err.code !== "USER_CANCELLED") {
        Alert.alert("Error", err.message || "Purchase failed");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert("Success", "Purchases restored successfully!");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to restore purchases");
    }
  };

  const features = [
    { icon: "infinite", title: "Unlimited Access", description: "All premium features unlocked" },
    { icon: "cloud-upload", title: "Cloud Sync", description: "Sync across all your devices" },
    { icon: "analytics", title: "Advanced Analytics", description: "Detailed insights and reports" },
    { icon: "shield-checkmark", title: "Priority Support", description: "24/7 dedicated support" },
    { icon: "color-wand", title: "Custom Themes", description: "Personalize your experience" },
    { icon: "flash", title: "Early Access", description: "Get new features first" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>
            Unlock all features and take your experience to the next level
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color="#10B981"
                />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <View style={styles.planSelection}>
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "yearly" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            {plans.yearly.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>{plans.yearly.savings}</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPlan === "yearly" && styles.radioOuterSelected,
                ]}
              >
                {selectedPlan === "yearly" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.planName}>Annual</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>{plans.yearly.price}</Text>
              <Text style={styles.planPeriod}>/{plans.yearly.period}</Text>
            </View>
            {plans.yearly.originalPrice && (
              <Text style={styles.originalPrice}>{plans.yearly.originalPrice}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === "monthly" && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <View style={styles.planHeader}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPlan === "monthly" && styles.radioOuterSelected,
                ]}
              >
                {selectedPlan === "monthly" && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.planName}>Monthly</Text>
            </View>
            <View style={styles.planPricing}>
              <Text style={styles.planPrice}>{plans.monthly.price}</Text>
              <Text style={styles.planPeriod}>/{plans.monthly.period}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.legal}>
          Subscription automatically renews unless auto-renew is turned off at least
          24 hours before the current period ends. Your account will be charged for
          renewal within 24 hours prior to the end of the current period.
        </Text>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <>
              <Text style={styles.purchaseButtonText}>
                Start Free Trial
              </Text>
              <Text style={styles.purchaseButtonSubtext}>
                Then {plans[selectedPlan].price}/{plans[selectedPlan].period}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 180,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F59E0B20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FAFAFA",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#71717A",
    textAlign: "center",
    maxWidth: 280,
  },
  featuresGrid: {
    marginVertical: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#10B98120",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  featureDescription: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  planSelection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#27272A",
    position: "relative",
  },
  planCardSelected: {
    borderColor: "#10B981",
    backgroundColor: "#10B98110",
  },
  savingsBadge: {
    position: "absolute",
    top: -10,
    right: 10,
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#71717A",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#10B981",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  planName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  planPeriod: {
    fontSize: 14,
    color: "#71717A",
  },
  originalPrice: {
    fontSize: 14,
    color: "#71717A",
    textDecorationLine: "line-through",
    marginTop: 4,
  },
  legal: {
    fontSize: 11,
    color: "#52525B",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
  },
  restoreButton: {
    alignItems: "center",
    padding: 12,
  },
  restoreButtonText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0A0A0A",
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
  },
  purchaseButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  purchaseButtonSubtext: {
    fontSize: 13,
    color: "#0A0A0A80",
    marginTop: 4,
  },
  cancelButton: {
    alignItems: "center",
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#71717A",
  },
});

