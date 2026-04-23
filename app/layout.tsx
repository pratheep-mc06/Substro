import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Substro — Subscription Analyzer",
  description: "Find and cancel recurring subscriptions from your bank statements.",
};

import { AppShells } from "@/components/AppShells";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        {children}
        <AppShells />
        <Toaster position="bottom-right" />
      </body>
    </html>

  );
}

