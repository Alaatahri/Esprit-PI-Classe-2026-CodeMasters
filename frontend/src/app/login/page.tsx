"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { getStoredUser, normalizeRole } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getStoredUser();
    if (existing) {
      const r = normalizeRole(existing.role);
      const target =
        r === "client"
          ? "/espace/client"
          : r === "expert"
          ? "/espace/expert"
          : r === "artisan"
          ? "/espace/artisan"
          : r === "admin"
          ? "/espace/admin"
          : "/espace";
      router.replace(target);
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), mot_de_passe: password }),
      });

      const data = await res.json();

      if (!data.success || !data.user) {
        setError(data.message || "Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // Stocker l'utilisateur et le token (rôle normalisé pour la navbar / garde-fous)
      const token = btoa(`${data.user._id}-${Date.now()}`);
      const userToStore = {
        ...data.user,
        role: normalizeRole(data.user.role),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("bmp_user", JSON.stringify(userToStore));
        localStorage.setItem("bmp_token", token);
      }

      // Rediriger vers l'espace adapté au rôle
      const r = normalizeRole(data.user.role);
      const target =
        r === "client"
          ? "/espace/client"
          : r === "expert"
          ? "/espace/expert"
          : r === "artisan"
          ? "/espace/artisan"
          : r === "admin"
          ? "/espace/admin"
          : "/espace";
      router.push(target);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion au serveur"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-10 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
            <Building2 className="w-7 h-7 text-gray-900" />
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
              BMP.tn
            </span>
            <div className="text-xs text-blue-300/70 font-light tracking-widest mt-0.5">
              CONNEXION
            </div>
          </div>
        </Link>

        {/* Card */}
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Connexion
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Accédez à votre tableau de bord
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Captcha placeholder - à remplacer par hCaptcha/reCAPTCHA */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                [ CAPTCHA - à activer avec hCaptcha ]
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              S&apos;inscrire
            </Link>
          </p>

          {/* Comptes de test (dev only) */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center mb-3">
              Comptes de test (dev)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { label: "Client", email: "ahmed@example.com", pass: "password123" },
                { label: "Expert", email: "sara@example.com", pass: "password123" },
                { label: "Admin", email: "admin@bmp.tn", pass: "admin123" },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    setEmail(c.email);
                    setPassword(c.pass);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-amber-400 hover:border-amber-500/30 text-xs transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
