import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { usePurchases } from "@croissantpay/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function ProductsScreen() {
  const { offerings, purchaseProduct, isLoading, error } = usePurchases();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (product: any) => {
    setPurchasing(product.identifier);
    try {
      const result = await purchaseProduct(product);
      if (result.success) {
        Alert.alert("Success!", "Purchase completed successfully.", [
          { text: "OK" },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Failed to load products</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  const currentOffering = offerings?.current;
  const packages = currentOffering?.packages || [];

  // Demo products for when SDK isn't connected to real store
  const demoProducts = [
    {
      identifier: "pro_monthly",
      product: {
        identifier: "pro_monthly",
        title: "Pro Monthly",
        description: "Unlock all features for a month",
        priceString: "$9.99/month",
        price: 9.99,
        currencyCode: "USD",
      },
    },
    {
      identifier: "pro_yearly",
      product: {
        identifier: "pro_yearly",
        title: "Pro Yearly",
        description: "Best value - 2 months free!",
        priceString: "$99.99/year",
        price: 99.99,
        currencyCode: "USD",
      },
    },
    {
      identifier: "coins_100",
      product: {
        identifier: "coins_100",
        title: "100 Coins",
        description: "In-game currency pack",
        priceString: "$0.99",
        price: 0.99,
        currencyCode: "USD",
      },
    },
  ];

  const displayProducts = packages.length > 0 ? packages : demoProducts;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Products</Text>
        <Text style={styles.subtitle}>
          {packages.length > 0
            ? `Showing ${packages.length} products from ${currentOffering?.identifier || "default"} offering`
            : "Demo products - Connect to CroissantPay to see real products"}
        </Text>
      </View>

      {/* Subscriptions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="repeat" size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Subscriptions</Text>
        </View>
        {displayProducts
          .filter((p: any) => 
            p.product?.identifier?.includes("monthly") || 
            p.product?.identifier?.includes("yearly") ||
            p.product?.identifier?.includes("subscription")
          )
          .map((pkg: any) => (
            <ProductCard
              key={pkg.identifier}
              product={pkg.product}
              onPurchase={() => handlePurchase(pkg.product)}
              isPurchasing={purchasing === pkg.product.identifier}
            />
          ))}
      </View>

      {/* One-Time Purchases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>One-Time Purchases</Text>
        </View>
        {displayProducts
          .filter((p: any) => 
            !p.product?.identifier?.includes("monthly") && 
            !p.product?.identifier?.includes("yearly") &&
            !p.product?.identifier?.includes("subscription")
          )
          .map((pkg: any) => (
            <ProductCard
              key={pkg.identifier}
              product={pkg.product}
              onPurchase={() => handlePurchase(pkg.product)}
              isPurchasing={purchasing === pkg.product.identifier}
            />
          ))}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3B82F6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Products are configured in your CroissantPay dashboard and synced with
            App Store Connect / Google Play Console. The SDK automatically
            fetches the latest prices and availability.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProductCard({
  product,
  onPurchase,
  isPurchasing,
}: {
  product: any;
  onPurchase: () => void;
  isPurchasing: boolean;
}) {
  const isSubscription =
    product.identifier?.includes("monthly") ||
    product.identifier?.includes("yearly") ||
    product.identifier?.includes("subscription");

  return (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productTitle}>{product.title}</Text>
          {isSubscription && (
            <View style={styles.subscriptionBadge}>
              <Ionicons name="repeat" size={12} color="#10B981" />
            </View>
          )}
        </View>
        <Text style={styles.productDescription}>{product.description}</Text>
        <Text style={styles.productPrice}>{product.priceString}</Text>
      </View>
      <TouchableOpacity
        style={[styles.buyButton, isPurchasing && styles.buyButtonDisabled]}
        onPress={onPurchase}
        disabled={isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color="#FAFAFA" />
        ) : (
          <Text style={styles.buyButtonText}>Buy</Text>
        )}
      </TouchableOpacity>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#0A0A0A",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#71717A",
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#71717A",
    textAlign: "center",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FAFAFA",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#71717A",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FAFAFA",
  },
  subscriptionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B98120",
    alignItems: "center",
    justifyContent: "center",
  },
  productDescription: {
    fontSize: 13,
    color: "#71717A",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  buyButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  buyButtonDisabled: {
    backgroundColor: "#10B98180",
  },
  buyButtonText: {
    color: "#FAFAFA",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#1E3A5F20",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#3B82F640",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#71717A",
    lineHeight: 20,
  },
});

