"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Building2, ArrowRight, Loader2 } from "lucide-react";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5173";
const LOGIN_URL = `${ADMIN_URL}/login`;

export default function LoginPage() {
  useEffect(() => {
    window.location.href = LOGIN_URL;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-gray-900" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Redirection vers l&apos;espace admin</h1>
        <p className="text-gray-400 mb-6">Vous allez être redirigé vers le tableau de bord BMP.tn.</p>
        <div className="flex justify-center gap-2 mb-8">
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
        <a
          href={LOGIN_URL}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-semibold hover:opacity-90 transition-opacity"
        >
          Accéder au tableau de bord
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
