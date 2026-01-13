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

export const metadata: Metadata = {
  title: "CroissantPay - In-App Purchase Management",
  description: "Self-hosted subscription and in-app purchase management for React Native",
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

