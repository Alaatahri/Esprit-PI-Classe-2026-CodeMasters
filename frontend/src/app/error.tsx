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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="bmp-app-vignette" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-md text-center">
        <div className="mb-10">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-red-500/30 bg-gradient-to-br from-red-500/20 to-amber-500/20">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground">
            Une erreur est survenue
          </h1>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Une erreur inattendue s&apos;est produite. Notre équipe technique en a été informée.
          </p>
          <div className="bmp-panel mb-6 rounded-xl p-4 text-left">
            <code className="break-all text-sm text-muted-foreground">
              {error.message || "Erreur inconnue"}
            </code>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 font-bold text-gray-900 transition-[box-shadow,transform] duration-300 hover:shadow-lg hover:shadow-amber-500/25 motion-safe:active:scale-[0.99]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-white/10 px-6 py-3 font-semibold text-foreground backdrop-blur-xl transition-[background-color,border-color] duration-300 hover:bg-white/15"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}