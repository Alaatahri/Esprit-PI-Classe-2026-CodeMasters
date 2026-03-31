import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotLayout } from "@/components/ChatbotLayout";
import GlobalNavbar from "@/components/GlobalNavbar";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalNavbar />
        {children}
        {/* Chatbot intégré - affiché sur toutes les pages */}
        <ChatbotLayout />
      </body>
    </html>
  );
}
