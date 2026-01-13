import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { usePurchases } from "@croissantpay/react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const { subscriber, hasEntitlement, isLoading } = usePurchases();

  const isPro = hasEntitlement("pro") || hasEntitlement("premium");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="phone-portrait" size={32} color="#10B981" />
          </View>
          <Text style={styles.title}>CroissantPay Demo</Text>
        </View>
        <Text style={styles.subtitle}>
          In-App Purchase Demo with CroissantPay SDK
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Account Status</Text>
          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
            <Text style={styles.badgeText}>{isPro ? "PRO" : "FREE"}</Text>
          </View>
        </View>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <View style={styles.statusInfo}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>User ID</Text>
              <Text style={styles.statusValue} numberOfLines={1}>
                {subscriber?.id || "demo_user_123"}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Entitlements</Text>
              <Text style={styles.statusValue}>
                {isPro ? "Pro Access" : "None"}
              </Text>
            </View>
          </View>
        )}

        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/paywall")}
          >
            <Ionicons name="star" size={20} color="#FAFAFA" />
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featureGrid}>
          <FeatureCard
            icon="checkmark-circle"
            title="Receipt Validation"
            description="Automatic server-side validation"
            available
          />
          <FeatureCard
            icon="sync"
            title="Cross-Platform Sync"
            description="iOS & Android unified"
            available
          />
          <FeatureCard
            icon="shield-checkmark"
            title="Entitlements"
            description="Easy access control"
            available
          />
          <FeatureCard
            icon="analytics"
            title="Analytics"
            description="Revenue insights"
            available={isPro}
            pro
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/products")}
        >
          <Ionicons name="cart-outline" size={24} color="#10B981" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Products</Text>
            <Text style={styles.actionDescription}>
              Browse available in-app purchases
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#71717A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/subscription")}
        >
          <Ionicons name="star-outline" size={24} color="#10B981" />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Subscription</Text>
            <Text style={styles.actionDescription}>
              View and manage your subscription
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#71717A" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  available,
  pro,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  available: boolean;
  pro?: boolean;
}) {
  return (
    <View style={[styles.featureCard, !available && styles.featureCardLocked]}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={24}
          color={available ? "#10B981" : "#71717A"}
        />
      </View>
      <Text style={[styles.featureTitle, !available && styles.featureTitleLocked]}>
        {title}
      </Text>
      <Text style={styles.featureDescription}>{description}</Text>
      {pro && !available && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      )}
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
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#10B98120",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FAFAFA",
  },
  subtitle: {
    fontSize: 16,
    color: "#71717A",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeFree: {
    backgroundColor: "#27272A",
  },
  badgePro: {
    backgroundColor: "#10B981",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  loadingText: {
    color: "#71717A",
  },
  statusInfo: {
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 14,
    color: "#71717A",
  },
  statusValue: {
    fontSize: 14,
    color: "#FAFAFA",
    fontWeight: "500",
    maxWidth: "60%",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
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
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  featureCardLocked: {
    opacity: 0.6,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#10B98120",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FAFAFA",
    marginBottom: 4,
  },
  featureTitleLocked: {
    color: "#71717A",
  },
  featureDescription: {
    fontSize: 12,
    color: "#71717A",
  },
  proBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
    gap: 12,
  },
  actionContent: {
    flex: 1,
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
});

