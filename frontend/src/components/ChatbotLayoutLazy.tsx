"use client";

import dynamic from "next/dynamic";

const ChatbotLayout = dynamic(
  () => import("./ChatbotLayout").then((m) => ({ default: m.ChatbotLayout })),
  { ssr: false, loading: () => null },
);

export function ChatbotLayoutLazy() {
  return <ChatbotLayout />;
}
