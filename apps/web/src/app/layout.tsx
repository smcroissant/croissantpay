import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc/provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://croissantlabs.com";

export const metadata: Metadata = {
  title: {
    default: "CroissantPay - IAP Management for React Native (open source coming soon)",
    template: "%s | CroissantPay",
  },
  description:
    "In-app purchase and subscription management for React Native. Open source coming soon. Self-host for free or use our managed cloud. No revenue share.",
  keywords: [
    "in-app purchases",
    "subscriptions",
    "React Native",
    "RevenueCat alternative",
    "open source coming soon",
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
    title: "CroissantPay - IAP Management (open source coming soon)",
    description:
      "In-app purchase management for React Native. Open source coming soon. Self-host for free or use our managed cloud. No revenue share ever.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CroissantPay - IAP management for React Native (open source coming soon)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CroissantPay - IAP Management (open source coming soon)",
    description:
      "In-app purchase management for React Native. Open source coming soon. Self-host for free or use our managed cloud.",
    creator: "@croissantpay",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

