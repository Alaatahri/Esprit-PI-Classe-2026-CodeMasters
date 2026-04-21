import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotLayoutLazy } from "@/components/ChatbotLayoutLazy";
import { KeyboardTTS } from "@/components/KeyboardTTS";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { RootFrame } from "./RootFrame";

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
  description:
    "La plateforme intelligente qui connecte, automatise et optimise la chaîne de valeur du secteur de la construction.",
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
    <html lang="fr" className="dark" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} scrollbar-bmp flex min-h-screen flex-col bg-background text-foreground antialiased`}
      >
        <AccessibilityProvider>
          <LanguageProvider>
            <RootFrame>{children}</RootFrame>
            <KeyboardTTS />
            <ChatbotLayoutLazy />
          </LanguageProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
