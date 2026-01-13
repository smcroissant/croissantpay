import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from "react-native";
import { usePurchases } from "@croissantpay/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function SettingsScreen() {
  const { subscriber, syncPurchases, isLoading } = usePurchases();
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  const handleSync = async () => {
    try {
      await syncPurchases();
      Alert.alert("Success", "Purchases synced successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to sync purchases");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#71717A" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>Demo User</Text>
              <Text style={styles.accountId}>
                ID: {subscriber?.id || "demo_user_123"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={22} color="#FAFAFA" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#27272A", true: "#10B98180" }}
              thumbColor={notifications ? "#10B981" : "#71717A"}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="analytics-outline" size={22} color="#FAFAFA" />
              <Text style={styles.settingLabel}>Analytics</Text>
            </View>
            <Switch
              value={analytics}
              onValueChange={setAnalytics}
              trackColor={{ false: "#27272A", true: "#10B98180" }}
              thumbColor={analytics ? "#10B981" : "#71717A"}
            />
          </View>
        </View>
      </View>

      {/* Purchase Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchases</Text>
        <TouchableOpacity style={styles.actionCard} onPress={handleSync}>
          <Ionicons name="sync" size={22} color="#10B981" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Sync Purchases</Text>
            <Text style={styles.actionDescription}>
              Sync your purchase status with the server
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            Alert.alert(
              "Subscription Management",
              "This will redirect you to manage your subscription in device settings.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    // On iOS: App-Settings, on Android: Play Store subscriptions
                    Linking.openURL("app-settings:");
                  },
                },
              ]
            )
          }
        >
          <Ionicons name="card-outline" size={22} color="#3B82F6" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Manage Subscription</Text>
            <Text style={styles.actionDescription}>
              View and manage your active subscription
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

      {/* Developer Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        <View style={styles.card}>
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>SDK Version</Text>
            <Text style={styles.devValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>API URL</Text>
            <Text style={styles.devValue} numberOfLines={1}>
              http://localhost:3000
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.devRow}>
            <Text style={styles.devLabel}>Environment</Text>
            <View style={styles.envBadge}>
              <Text style={styles.envBadgeText}>Development</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => {
            console.log("Subscriber:", subscriber);
            Alert.alert(
              "Debug Info",
              `Subscriber: ${JSON.stringify(subscriber, null, 2)}`
            );
          }}
        >
          <Ionicons name="bug-outline" size={20} color="#F59E0B" />
          <Text style={styles.debugButtonText}>Log Debug Info</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Linking.openURL("https://croissantpay.dev/docs")}
        >
          <Ionicons name="book-outline" size={22} color="#FAFAFA" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Documentation</Text>
            <Text style={styles.actionDescription}>Learn how to use CroissantPay</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#71717A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Linking.openURL("https://github.com/croissantpay/croissantpay")}
        >
          <Ionicons name="logo-github" size={22} color="#FAFAFA" />
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>GitHub</Text>
            <Text style={styles.actionDescription}>View source code</Text>
          </View>
          <Ionicons name="open-outline" size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>CroissantPay Demo App</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  accountId: {
    fontSize: 13,
    color: "#71717A",
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#FAFAFA",
  },
  divider: {
    height: 1,
    backgroundColor: "#27272A",
    marginVertical: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  actionInfo: {
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
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  devLabel: {
    fontSize: 14,
    color: "#71717A",
  },
  devValue: {
    fontSize: 14,
    color: "#FAFAFA",
    fontFamily: "monospace",
    maxWidth: "60%",
  },
  envBadge: {
    backgroundColor: "#F59E0B20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  envBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B20",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F59E0B40",
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  footer: {
    alignItems: "center",
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#71717A",
  },
  footerVersion: {
    fontSize: 12,
    color: "#52525B",
    marginTop: 4,
  },
});

