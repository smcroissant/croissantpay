import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { usePurchases } from "@croissantpay/react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscriber, entitlements, hasEntitlement, restorePurchases, isLoading } = usePurchases();

  const isPro = hasEntitlement("pro") || hasEntitlement("premium");

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert("Success", "Purchases have been restored.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to restore purchases");
    }
  };

  // Get active entitlements
  const activeEntitlements = Object.entries(entitlements || {}).filter(
    ([_, ent]: [string, any]) => ent.isActive
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <View style={[styles.statusCard, isPro && styles.statusCardPro]}>
        <View style={styles.statusIcon}>
          <Ionicons
            name={isPro ? "star" : "star-outline"}
            size={32}
            color={isPro ? "#F59E0B" : "#71717A"}
          />
        </View>
        <Text style={styles.statusTitle}>
          {isPro ? "Pro Subscriber" : "Free User"}
        </Text>
        <Text style={styles.statusDescription}>
          {isPro
            ? "You have full access to all premium features"
            : "Upgrade to unlock all features"}
        </Text>
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/paywall")}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Entitlements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Entitlements</Text>
        {activeEntitlements.length > 0 ? (
          activeEntitlements.map(([id, ent]: [string, any]) => (
            <View key={id} style={styles.entitlementCard}>
              <View style={styles.entitlementIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View style={styles.entitlementInfo}>
                <Text style={styles.entitlementTitle}>{id}</Text>
                <Text style={styles.entitlementStatus}>Active</Text>
                {ent.expiresAt && (
                  <Text style={styles.entitlementExpiry}>
                    Expires: {new Date(ent.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {ent.willRenew && (
                <View style={styles.renewBadge}>
                  <Ionicons name="repeat" size={14} color="#10B981" />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="lock-closed-outline" size={40} color="#71717A" />
            <Text style={styles.emptyTitle}>No Active Entitlements</Text>
            <Text style={styles.emptyText}>
              Purchase a subscription to unlock premium features
            </Text>
          </View>
        )}
      </View>

      {/* Subscriber Info */}
      {subscriber && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscriber Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow label="User ID" value={subscriber.id} />
            <DetailRow
              label="First Seen"
              value={
                subscriber.createdAt
                  ? new Date(subscriber.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
            <DetailRow
              label="Total Purchases"
              value={subscriber.purchases?.length?.toString() || "0"}
            />
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleRestore}>
          <Ionicons name="refresh" size={24} color="#10B981" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Restore Purchases</Text>
            <Text style={styles.actionDescription}>
              Restore previous purchases on this device
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </TouchableOpacity>

        {isPro && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                "Manage Subscription",
                "This will open your device's subscription management settings."
              )
            }
          >
            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Subscription</Text>
              <Text style={styles.actionDescription}>
                Cancel or change your subscription
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Help */}
      <View style={styles.helpCard}>
        <Ionicons name="help-circle-outline" size={24} color="#71717A" />
        <Text style={styles.helpText}>
          Having issues with your subscription? Contact our support team for
          assistance.
        </Text>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  statusCardPro: {
    borderColor: "#F59E0B40",
    backgroundColor: "#F59E0B10",
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: "#FAFAFA",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
    marginBottom: 12,
  },
  entitlementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  entitlementIcon: {
    marginRight: 12,
  },
  entitlementInfo: {
    flex: 1,
  },
  entitlementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
    textTransform: "capitalize",
  },
  entitlementStatus: {
    fontSize: 13,
    color: "#10B981",
    marginTop: 2,
  },
  entitlementExpiry: {
    fontSize: 12,
    color: "#71717A",
    marginTop: 4,
  },
  renewBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B98120",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#71717A",
    textAlign: "center",
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  detailLabel: {
    fontSize: 14,
    color: "#71717A",
  },
  detailValue: {
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  actionDescription: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: "#71717A",
    lineHeight: 20,
  },
});

