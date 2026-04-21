"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, normalizeRole, type BMPUser } from "@/lib/auth";

export default function EspaceLivreurPage() {
  const router = useRouter();
  const [user, setUser] = useState<BMPUser | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (!u) {
      router.replace("/login");
      return;
    }
    if (normalizeRole(u.role) !== "livreur") {
      router.replace("/espace");
      return;
    }
    setBootstrapped(true);
  }, [router]);

  if (!bootstrapped || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center">
        <p className="text-lg sm:text-xl font-semibold text-white">
          Espace livreur en cours de construction 🚧
        </p>
      </div>
    </div>
  );
}

