"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { getStoredUser, normalizeRole, setStoredUser } from "@/lib/auth";
import { formatApiError } from "@/lib/api-error";
import { getApiBaseUrl } from "@/lib/api-base";
import { FieldError, fieldInputClass } from "@/lib/form-ui";
import { validateEmail, validateLoginPassword } from "@/lib/validators";

const API_URL = getApiBaseUrl();

type LoginField = "email" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailVerifyHint, setEmailVerifyHint] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({});
  const [loading, setLoading] = useState(false);

  const clearField = useCallback((key: LoginField) => {
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }, []);

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
    setEmailVerifyHint(false);
    setFieldErrors({});

    const eEmail = validateEmail(email);
    const ePw = validateLoginPassword(password);
    const next: Partial<Record<LoginField, string>> = {};
    if (eEmail) next.email = eEmail;
    if (ePw) next.password = ePw;
    if (Object.keys(next).length > 0) {
      setFieldErrors(next);
      setError("Veuillez corriger les champs indiqués.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          mot_de_passe: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = formatApiError(data, "Email ou mot de passe incorrect");
        setError(msg);
        setEmailVerifyHint(
          res.status === 401 && /vérifier votre email/i.test(msg),
        );
        setLoading(false);
        return;
      }

      if (!data.success || !data.user) {
        const msg = data.message || "Email ou mot de passe incorrect";
        setError(msg);
        setEmailVerifyHint(/vérifier votre email/i.test(msg));
        setLoading(false);
        return;
      }

      const token = btoa(`${data.user._id}-${Date.now()}`);
      const userToStore = {
        ...data.user,
        role: normalizeRole(data.user.role),
      };
      if (typeof window !== "undefined") {
        setStoredUser(userToStore);
        localStorage.setItem("bmp_token", token);
      }

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
        err instanceof Error ? err.message : "Erreur de connexion au serveur",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md sm:max-w-lg">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-8 sm:mb-10 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow shrink-0">
            <Building2 className="w-7 h-7 text-gray-900" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
              BMP.tn
            </span>
            <div className="text-xs text-blue-300/70 font-light tracking-widest mt-0.5">
              CONNEXION
            </div>
          </div>
        </Link>

        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
            Connexion
          </h1>
          <p className="text-gray-400 text-center mb-6 sm:mb-8 text-sm">
            Accédez à votre tableau de bord
          </p>

          <form noValidate onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div
                className={
                  emailVerifyHint
                    ? "flex items-start gap-3 p-4 rounded-xl bg-amber-500/15 border border-[#F5A623]/45 text-amber-100"
                    : "flex items-start gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200"
                }
                role="alert"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                E-mail <span className="text-red-400/90">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="email"
                  name="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearField("email");
                  }}
                  placeholder="nom@exemple.tn"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "err-login-email" : undefined}
                  className={fieldInputClass(!!fieldErrors.email, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-login-email" message={fieldErrors.email} />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe <span className="text-red-400/90">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearField("password");
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? "err-login-password" : undefined
                  }
                  className={fieldInputClass(!!fieldErrors.password, loading, {
                    hasLeftIcon: true,
                  })}
                />
              </div>
              <FieldError id="err-login-password" message={fieldErrors.password} />
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <a href="/forgot-password"
                  style={{ color: '#F5A623', fontSize: '13px', textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold text-base shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion…
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
                    setFieldErrors({});
                    setError("");
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
