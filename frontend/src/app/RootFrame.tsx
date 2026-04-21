"use client";

import { usePathname } from "next/navigation";
import GlobalNavbar from "@/components/GlobalNavbar";
import SiteFooter from "@/components/SiteFooter";
import { AppShell } from "@/components/layout/AppShell";

function isShellRoute(pathname: string) {
  return (
    pathname === "/espace" ||
    pathname.startsWith("/espace/") ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/") ||
    pathname.startsWith("/expert/") ||
    pathname.startsWith("/gestion-")
  );
}

export function RootFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const shell = isShellRoute(pathname);

  if (shell) {
    return (
      <div className="fixed inset-0 z-50">
        <AppShell>{children}</AppShell>
      </div>
    );
  }

  return (
    <>
      <GlobalNavbar />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteFooter />
    </>
  );
}

