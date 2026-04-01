"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Une erreur est survenue</h1>
          <p className="text-gray-300 mb-6">
            Une erreur inattendue s&apos;est produite. Notre équipe technique en a été informée.
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <code className="text-sm text-gray-400 break-all">
              {error.message || "Erreur inconnue"}
            </code>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold flex items-center justify-center gap-2 hover:shadow-amber-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          
          <Link
            href="/"
            className="px-6 py-3 rounded-xl backdrop-blur-xl bg-white/10 border border-amber-500/30 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}