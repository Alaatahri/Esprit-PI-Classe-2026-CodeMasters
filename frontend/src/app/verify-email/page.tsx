"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api-base";
import { formatApiError } from "@/lib/api-error";

const API_URL = getApiBaseUrl();
const ACCENT = "#F5A623";

type Status = "loading" | "success" | "error";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token?.trim()) {
      setStatus("error");
      setErrorMessage("Lien invalide ou expiré.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(token.trim())}`,
          { method: "GET", credentials: "include" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            formatApiError(data, "Lien invalide ou expiré."),
          );
          return;
        }
        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Impossible de joindre le serveur.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, #e89410)`,
            }}
          >
            <Building2 className="w-7 h-7 text-gray-900" />
          </div>
          <div>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: ACCENT }}
            >
              BMP.tn
            </span>
            <div className="text-xs text-gray-500 tracking-widest mt-0.5">
              VÉRIFICATION E-MAIL
            </div>
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-white/[0.07] rounded-3xl p-8 border border-white/15 shadow-2xl text-center">
          {status === "loading" && (
            <>
              <Loader2
                className="w-14 h-14 mx-auto mb-6 animate-spin"
                style={{ color: ACCENT }}
              />
              <h1 className="text-xl font-bold text-white mb-2">
                Vérification en cours…
              </h1>
              <p className="text-gray-400 text-sm">
                Merci de patienter quelques secondes.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${ACCENT}22` }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: ACCENT }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Email vérifié !
              </h1>
              <p className="text-gray-400 text-sm mb-8">
                Votre compte est activé. Vous pouvez vous connecter.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full min-h-[52px] rounded-xl font-bold text-gray-900 shadow-xl transition-opacity hover:opacity-95"
                style={{
                  background: `linear-gradient(90deg, ${ACCENT}, #f0c04a)`,
                }}
              >
                Se connecter
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                Lien invalide ou expiré
              </h1>
              <p className="text-gray-400 text-sm mb-8">{errorMessage}</p>
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full min-h-[48px] rounded-xl border border-white/20 text-gray-200 hover:border-[#F5A623]/50 hover:text-[#F5A623] transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#F5A623]" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
