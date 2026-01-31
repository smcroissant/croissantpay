import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_MARKETING_URL || "https://croissantpay.com";

export const metadata: Metadata = {
  title: {
    default: "CroissantPay - Open-Source IAP Management for React Native",
    template: "%s | CroissantPay",
  },
  description:
    "Open-source in-app purchase and subscription management for React Native. Self-host for free or use our managed cloud. No revenue share.",
  keywords: [
    "in-app purchases",
    "subscriptions",
    "React Native",
    "RevenueCat alternative",
    "open source",
    "IAP",
    "mobile payments",
    "StoreKit",
    "Google Play Billing",
  ],
  authors: [{ name: "CroissantPay" }],
  creator: "CroissantPay",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CroissantPay",
    title: "CroissantPay - Open-Source IAP Management",
    description:
      "Open-source in-app purchase management for React Native. Self-host for free or use our managed cloud. No revenue share ever.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CroissantPay - Open-Source IAP Management",
    description:
      "Open-source in-app purchase management for React Native. Self-host for free or use our managed cloud.",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
