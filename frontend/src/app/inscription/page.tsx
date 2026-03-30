"use client";

import { useMemo, useState, FormEvent } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const ROLES = [
  { value: "client", label: "Client" },
  { value: "expert", label: "Expert" },
  { value: "artisan", label: "Artisan" },
  { value: "manufacturer", label: "Fabricant" },
] as const;

type WorkZoneScope = "tn_all" | "tn_city" | "country" | "world";
type WorkZone = { scope: WorkZoneScope; value?: string };

export default function InscriptionPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("client");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [experienceAnnees, setExperienceAnnees] = useState<string>("");
  const [zoneTunisie, setZoneTunisie] = useState(false);
  const [zoneMonde, setZoneMonde] = useState(false);
  const [zoneVillesTunisie, setZoneVillesTunisie] = useState(false);
  const [zonePays, setZonePays] = useState(false);
  const [villesTunisie, setVillesTunisie] = useState("");
  const [pays, setPays] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isArtisan = role === "artisan";

  const parsedVilles = useMemo(() => {
    return villesTunisie
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [villesTunisie]);

  const parsedPays = useMemo(() => {
    return pays
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [pays]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    let zones_travail: WorkZone[] | undefined = undefined;
    if (isArtisan) {
      const s = specialite.trim();
      if (!s) {
        setError("Veuillez renseigner votre spécialité (artisan)");
        return;
      }

      const exp = Number(experienceAnnees);
      if (!Number.isFinite(exp) || exp < 0) {
        setError("Veuillez renseigner une expérience valide (en années)");
        return;
      }

      const zones: WorkZone[] = [];
      if (zoneTunisie) zones.push({ scope: "tn_all" });
      if (zoneMonde) zones.push({ scope: "world" });
      if (zoneVillesTunisie) {
        for (const v of parsedVilles) zones.push({ scope: "tn_city", value: v });
      }
      if (zonePays) {
        for (const c of parsedPays) zones.push({ scope: "country", value: c });
      }

      if (zoneVillesTunisie && parsedVilles.length === 0) {
        setError("Ajoute au moins une ville (Tunisie) ou décoche l’option");
        return;
      }
      if (zonePays && parsedPays.length === 0) {
        setError("Ajoute au moins un pays ou décoche l’option");
        return;
      }
      if (zones.length === 0) {
        setError("Sélectionne au moins une zone de travail");
        return;
      }

      zones_travail = zones;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          email: email.trim(),
          telephone: telephone.trim() || undefined,
          role: role,
          mot_de_passe: password,
          ...(isArtisan
            ? {
                specialite: specialite.trim(),
                experience_annees: Number(experienceAnnees),
                zones_travail,
              }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message || data.error || "Erreur lors de l'inscription"
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de connexion au serveur"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Inscription réussie
            </h1>
            <p className="text-gray-400 mb-8">
              Votre compte a été créé. Vous pouvez maintenant vous connecter.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-xl"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-10 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/50 transition-shadow">
            <Building2 className="w-7 h-7 text-gray-900" />
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-white to-amber-100 bg-clip-text text-transparent">
              BMP.tn
            </span>
            <div className="text-xs text-blue-300/70 font-light tracking-widest mt-0.5">
              INSCRIPTION
            </div>
          </div>
        </Link>

        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            Créer un compte
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Rejoignez la plateforme BMP.tn
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                <input
                  id="nom"
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

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
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="telephone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Téléphone (optionnel)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                <input
                  id="telephone"
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+216 XX XXX XXX"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Rôle
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as (typeof ROLES)[number]["value"])
                }
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right-4 bg-[length:20px] pr-12"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-gray-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {isArtisan && (
              <div className="space-y-5 rounded-2xl border border-white/15 bg-white/5 p-5">
                <div>
                  <label
                    htmlFor="specialite"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Spécialité
                  </label>
                  <input
                    id="specialite"
                    type="text"
                    value={specialite}
                    onChange={(e) => setSpecialite(e.target.value)}
                    placeholder="Ex: Maçonnerie, Plomberie, Électricité..."
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="experience"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Expérience (années)
                  </label>
                  <input
                    id="experience"
                    type="number"
                    min={0}
                    step={1}
                    value={experienceAnnees}
                    onChange={(e) => setExperienceAnnees(e.target.value)}
                    placeholder="Ex: 5"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-300 mb-2">
                    Zones de travail (choix multiples)
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={zoneTunisie}
                        onChange={(e) => setZoneTunisie(e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 accent-amber-400"
                      />
                      Toute la Tunisie
                    </label>

                    <label className="flex items-center gap-3 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={zoneVillesTunisie}
                        onChange={(e) => setZoneVillesTunisie(e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 accent-amber-400"
                      />
                      Villes spécifiques (Tunisie)
                    </label>

                    {zoneVillesTunisie && (
                      <input
                        type="text"
                        value={villesTunisie}
                        onChange={(e) => setVillesTunisie(e.target.value)}
                        placeholder="Ex: Tunis, Sfax, Sousse"
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                      />
                    )}

                    <label className="flex items-center gap-3 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={zonePays}
                        onChange={(e) => setZonePays(e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 accent-amber-400"
                      />
                      Pays spécifiques (Europe / Amérique)
                    </label>

                    {zonePays && (
                      <input
                        type="text"
                        value={pays}
                        onChange={(e) => setPays(e.target.value)}
                        placeholder="Ex: France, Italie, Canada"
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                      />
                    )}

                    <label className="flex items-center gap-3 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={zoneMonde}
                        onChange={(e) => setZoneMonde(e.target.checked)}
                        disabled={loading}
                        className="h-4 w-4 accent-amber-400"
                      />
                      Partout dans le monde
                    </label>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Astuce: pour les villes/pays, sépare par des virgules.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mot de passe (min. 6 caractères)
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
                  minLength={6}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email verification placeholder */}
            <p className="text-xs text-gray-500 text-center">
              [ Vérification email - à implémenter ]
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-gray-900 font-bold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Inscription...
                </>
              ) : (
                "S&apos;inscrire"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
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
