import { db } from "./index";
import {
  user,
  organization,
  organizationMember,
  app,
  product,
  entitlement,
  productEntitlement,
  offering,
  offeringProduct,
  subscriber,
  subscription,
  purchase,
  subscriberEntitlement,
} from "./schema";
import { account } from "./schema";
import crypto from "crypto";

// Generate random IDs
function generateId(prefix: string = ""): string {
  return prefix + crypto.randomBytes(16).toString("hex");
}

function generateApiKey(type: "public" | "secret"): string {
  const prefix = type === "public" ? "mx_public_" : "mx_secret_";
  return prefix + crypto.randomBytes(24).toString("base64url");
}

// Hash password for demo user
async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - in production Better Auth handles this
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt_for_demo");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create demo user
  console.log("Creating demo user...");
  const demoUserId = generateId();
  const passwordHash = await hashPassword("demo123");

  await db.insert(user).values({
    id: demoUserId,
    name: "Demo User",
    email: "demo@croissantpay.dev",
    emailVerified: true,
  });

  await db.insert(account).values({
    id: generateId(),
    accountId: demoUserId,
    providerId: "credential",
    userId: demoUserId,
    password: passwordHash,
  });

  // 2. Create organization
  console.log("Creating organization...");
  const [org] = await db
    .insert(organization)
    .values({
      name: "Demo Company",
      slug: "demo-company",
    })
    .returning();

  await db.insert(organizationMember).values({
    organizationId: org.id,
    userId: demoUserId,
    role: "owner",
  });

  // 3. Create demo app
  console.log("Creating demo app...");
  const [demoApp] = await db
    .insert(app)
    .values({
      organizationId: org.id,
      name: "Demo Fitness App",
      bundleId: "com.demo.fitnessapp",
      packageName: "com.demo.fitnessapp",
      publicKey: generateApiKey("public"),
      secretKey: generateApiKey("secret"),
    })
    .returning();

  console.log(`  Public Key: ${demoApp.publicKey}`);
  console.log(`  Secret Key: ${demoApp.secretKey}`);

  // 4. Create entitlements
  console.log("Creating entitlements...");
  const [proEntitlement] = await db
    .insert(entitlement)
    .values({
      appId: demoApp.id,
      identifier: "pro",
      displayName: "Pro Access",
      description: "Full access to all premium features",
    })
    .returning();

  const [premiumEntitlement] = await db
    .insert(entitlement)
    .values({
      appId: demoApp.id,
      identifier: "premium",
      displayName: "Premium Access",
      description: "Premium tier with advanced features",
    })
    .returning();

  // 5. Create products
  console.log("Creating products...");
  
  // iOS Products
  const [proMonthlyIos] = await db
    .insert(product)
    .values({
      appId: demoApp.id,
      identifier: "pro_monthly",
      storeProductId: "com.demo.fitnessapp.pro.monthly",
      platform: "ios",
      type: "auto_renewable_subscription",
      displayName: "Pro Monthly",
      description: "Full access to all features, billed monthly",
      subscriptionPeriod: "P1M",
      trialDuration: "P7D",
    })
    .returning();

  const [proYearlyIos] = await db
    .insert(product)
    .values({
      appId: demoApp.id,
      identifier: "pro_yearly",
      storeProductId: "com.demo.fitnessapp.pro.yearly",
      platform: "ios",
      type: "auto_renewable_subscription",
      displayName: "Pro Yearly",
      description: "Full access to all features, billed yearly - save 17%!",
      subscriptionPeriod: "P1Y",
      trialDuration: "P7D",
    })
    .returning();

  // Android Products
  const [proMonthlyAndroid] = await db
    .insert(product)
    .values({
      appId: demoApp.id,
      identifier: "pro_monthly_android",
      storeProductId: "pro_monthly",
      platform: "android",
      type: "auto_renewable_subscription",
      displayName: "Pro Monthly",
      description: "Full access to all features, billed monthly",
      subscriptionPeriod: "P1M",
      trialDuration: "P7D",
    })
    .returning();

  const [proYearlyAndroid] = await db
    .insert(product)
    .values({
      appId: demoApp.id,
      identifier: "pro_yearly_android",
      storeProductId: "pro_yearly",
      platform: "android",
      type: "auto_renewable_subscription",
      displayName: "Pro Yearly",
      description: "Full access to all features, billed yearly - save 17%!",
      subscriptionPeriod: "P1Y",
      trialDuration: "P7D",
    })
    .returning();

  // Consumable
  const [coinPack] = await db
    .insert(product)
    .values({
      appId: demoApp.id,
      identifier: "coins_100",
      storeProductId: "com.demo.fitnessapp.coins.100",
      platform: "ios",
      type: "consumable",
      displayName: "100 Coins",
      description: "In-app currency pack",
    })
    .returning();

  // 6. Link products to entitlements
  console.log("Linking products to entitlements...");
  await db.insert(productEntitlement).values([
    { productId: proMonthlyIos.id, entitlementId: proEntitlement.id },
    { productId: proYearlyIos.id, entitlementId: proEntitlement.id },
    { productId: proYearlyIos.id, entitlementId: premiumEntitlement.id },
    { productId: proMonthlyAndroid.id, entitlementId: proEntitlement.id },
    { productId: proYearlyAndroid.id, entitlementId: proEntitlement.id },
    { productId: proYearlyAndroid.id, entitlementId: premiumEntitlement.id },
  ]);

  // 7. Create offerings
  console.log("Creating offerings...");
  const [defaultOffering] = await db
    .insert(offering)
    .values({
      appId: demoApp.id,
      identifier: "default",
      displayName: "Default Offering",
      description: "Standard subscription options",
      isCurrent: true,
    })
    .returning();

  await db.insert(offeringProduct).values([
    { offeringId: defaultOffering.id, productId: proMonthlyIos.id, position: 0 },
    { offeringId: defaultOffering.id, productId: proYearlyIos.id, position: 1 },
    { offeringId: defaultOffering.id, productId: proMonthlyAndroid.id, position: 2 },
    { offeringId: defaultOffering.id, productId: proYearlyAndroid.id, position: 3 },
  ]);

  // 8. Create demo subscribers
  console.log("Creating demo subscribers...");
  const subscribers = [];
  const subscriberCount = 25;

  for (let i = 0; i < subscriberCount; i++) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 60));

    const [sub] = await db
      .insert(subscriber)
      .values({
        appId: demoApp.id,
        appUserId: `user_${generateId().slice(0, 8)}`,
        firstSeenAt: createdAt,
        lastSeenAt: new Date(),
        createdAt,
      })
      .returning();

    subscribers.push(sub);
  }

  // 9. Create demo subscriptions and purchases
  console.log("Creating demo subscriptions...");
  const now = new Date();
  const activeSubscriptions = Math.floor(subscriberCount * 0.7); // 70% active

  for (let i = 0; i < activeSubscriptions; i++) {
    const sub = subscribers[i];
    const isYearly = Math.random() > 0.6;
    const isIos = Math.random() > 0.4;
    const productId = isIos
      ? isYearly
        ? proYearlyIos.id
        : proMonthlyIos.id
      : isYearly
      ? proYearlyAndroid.id
      : proMonthlyAndroid.id;

    const purchaseDate = new Date(sub.createdAt);
    purchaseDate.setHours(purchaseDate.getHours() + Math.floor(Math.random() * 24));

    const expiresDate = new Date(purchaseDate);
    if (isYearly) {
      expiresDate.setFullYear(expiresDate.getFullYear() + 1);
    } else {
      expiresDate.setMonth(expiresDate.getMonth() + 1);
    }

    // Only active if not expired
    const isActive = expiresDate > now;
    const priceAmount = isYearly ? 99990000 : 9990000; // micros

    const transactionId = `T${Date.now()}${i}`;
    
    // Create purchase
    await db.insert(purchase).values({
      subscriberId: sub.id,
      productId,
      platform: isIos ? "ios" : "android",
      storeTransactionId: transactionId,
      originalTransactionId: transactionId,
      status: "completed",
      priceAmountMicros: priceAmount,
      priceCurrencyCode: "USD",
      purchaseDate,
      expiresDate,
      environment: "sandbox",
    });

    // Create subscription
    const [subscription_record] = await db
      .insert(subscription)
      .values({
        subscriberId: sub.id,
        productId,
        platform: isIos ? "ios" : "android",
        originalTransactionId: transactionId,
        latestTransactionId: transactionId,
        status: isActive ? "active" : "expired",
        purchaseDate,
        originalPurchaseDate: purchaseDate,
        expiresDate,
        autoRenewEnabled: isActive,
        isTrialPeriod: false,
        environment: "sandbox",
      })
      .returning();

    // Grant entitlements for active subscriptions
    if (isActive) {
      await db.insert(subscriberEntitlement).values({
        subscriberId: sub.id,
        entitlementId: proEntitlement.id,
        productId,
        subscriptionId: subscription_record.id,
        isActive: true,
        expiresDate,
      });

      if (isYearly) {
        await db.insert(subscriberEntitlement).values({
          subscriberId: sub.id,
          entitlementId: premiumEntitlement.id,
          productId,
          subscriptionId: subscription_record.id,
          isActive: true,
          expiresDate,
        });
      }
    }
  }

  // 10. Summary
  console.log("\n✅ Seed completed!\n");
  console.log("📊 Summary:");
  console.log(`   - 1 Demo User (demo@croissantpay.dev / demo123)`);
  console.log(`   - 1 Organization`);
  console.log(`   - 1 App with API keys`);
  console.log(`   - 2 Entitlements (pro, premium)`);
  console.log(`   - 5 Products (subscriptions + consumable)`);
  console.log(`   - 1 Offering`);
  console.log(`   - ${subscriberCount} Subscribers`);
  console.log(`   - ${activeSubscriptions} Subscriptions\n`);
  console.log("🔑 API Keys:");
  console.log(`   Public: ${demoApp.publicKey}`);
  console.log(`   Secret: ${demoApp.secretKey}\n`);
}

// Run if called directly
seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

