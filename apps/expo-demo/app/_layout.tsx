import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CroissantPayProvider } from "@croissantpay/react-native";
import * as SplashScreen from "expo-splash-screen";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Demo user ID - in production, use your auth system's user ID
const DEMO_USER_ID = "demo_user_123";

// CroissantPay API configuration
const CROISSANTPAY_CONFIG = {
  // Replace with your CroissantPay API key from the dashboard
  apiKey: "mx_public_your_api_key_here",
  // For self-hosted: use your server URL
  // For cloud: use https://api.croissantpay.dev
  apiUrl: "http://localhost:3000",
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Add any initialization logic here
        // e.g., load fonts, fetch initial data
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <CroissantPayProvider
      apiKey={CROISSANTPAY_CONFIG.apiKey}
      userId={DEMO_USER_ID}
      apiUrl={CROISSANTPAY_CONFIG.apiUrl}
    >
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0A0A0A",
          },
          headerTintColor: "#FAFAFA",
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: "#0A0A0A",
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: "modal",
            title: "Upgrade to Pro",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </CroissantPayProvider>
  );
}

