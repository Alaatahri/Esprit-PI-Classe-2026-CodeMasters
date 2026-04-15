"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, normalizeRole } from "@/lib/auth";

/**
 * Tableau de bord livreur (placeholder).
 * Garde d’accès : rôle livreur uniquement ; sinon redirection.
 */
export default function LivreurDashboardPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    if (normalizeRole(u.role) !== "livreur") {
      router.replace("/espace");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500 text-sm">
        Chargement…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-12rem)] px-4 py-16 text-center">
      <p className="text-xl sm:text-2xl text-gray-200 font-medium max-w-lg leading-relaxed">
        Espace livreur en cours de construction 🚧
      </p>
    </div>
  );
}
