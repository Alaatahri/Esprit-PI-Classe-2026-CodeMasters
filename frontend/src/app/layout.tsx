import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotLayout } from "@/components/ChatbotLayout";
import { KeyboardTTS } from "@/components/KeyboardTTS";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import GlobalNavbar from "@/components/GlobalNavbar";
import SiteFooter from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BMP.tn – Construction Digitale",
  description: "La plateforme intelligente qui connecte, automatise et optimise la chaîne de valeur du secteur de la construction.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} scrollbar-bmp flex min-h-screen flex-col bg-background text-foreground antialiased`}
      >
        <AccessibilityProvider>
          <LanguageProvider>
            <GlobalNavbar />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <SiteFooter />
            <KeyboardTTS />
            <ChatbotLayout />
          </LanguageProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
