"use client";

import { useState, FormEvent, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { getStoredUser, normalizeRole, setStoredUser } from "@/lib/auth";
import { getHomePathForRole } from "@/lib/roles";
import { formatApiError } from "@/lib/api-error";
import { getApiBaseUrl } from "@/lib/api-base";
import { FieldError, fieldInputClass } from "@/lib/form-ui";
import { validateEmail, validateLoginPassword } from "@/lib/validators";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      router.replace(getHomePathForRole(existing.role));
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

      router.push(getHomePathForRole(data.user.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      setError(
        msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")
          ? "Serveur inatteignable. Veuillez vérifier que votre backend (API) est bien démarré."
          : msg,
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-background via-gray-950 to-gray-950 px-4 py-12">
      <PageContainer size="narrow" className="w-full">
        <Link
          href="/"
          className="group mb-8 flex items-center justify-center gap-3 sm:mb-10"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/30 transition-shadow group-hover:shadow-amber-500/50">
            <Building2 className="h-7 w-7 text-gray-900" />
          </div>
          <div className="min-w-0 text-left">
            <span className="bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-2xl font-bold text-transparent">
              BMP.tn
            </span>
            <div className="mt-0.5 text-xs font-light tracking-widest text-muted-foreground">
              CONNEXION
            </div>
          </div>
        </Link>

        <Card className="overflow-hidden border-white/10 shadow-2xl shadow-black/40">
          <CardHeader className="space-y-1 pb-2 text-center sm:text-left">
            <CardTitle className="text-xl sm:text-2xl">Connexion</CardTitle>
            <CardDescription>
              Accédez à votre tableau de bord sécurisé.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-amber-400/95 transition-colors duration-200 hover:text-amber-300 hover:underline underline-offset-4"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full touch-manipulation text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/inscription"
              className="font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              S&apos;inscrire
            </Link>
          </p>

          <div className="mt-6 border-t border-white/10 pt-6">
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
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-amber-400">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </PageContainer>
    </div>
  );
}
