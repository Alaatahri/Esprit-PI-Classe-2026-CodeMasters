"""Analyse de complexité de projet et types de travailleurs requis."""

from __future__ import annotations

import re
import unicodedata

from app.models import ProjectAnalysisInput, ProjectAnalysisOutput

# STEP 2 — catégories
CAT_WEIGHT_0 = frozenset({"renovation_simple", "amenagement"})
CAT_WEIGHT_1 = frozenset({"renovation_complexe", "installation_technique"})
CAT_WEIGHT_2 = frozenset({"construction_neuve", "gros_oeuvre", "expertise_etude"})

COMPLEXE_KW = [
    "plans",
    "permis",
    "R+1",
    "R+2",
    "R+3",
    "fondations",
    "dalle",
    "béton armé",
    "beton arme",
    "structure",
    "villa",
    "immeuble",
    "chantier complet",
]

MOYEN_KW = [
    "rénovation complète",
    "renovation complete",
    "salle de bain",
    "cuisine",
    "installation",
    "réseau",
    "reseau",
    "tableau électrique",
    "tableau electrique",
    "chape",
    "isolation",
]

def _normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def _keyword_hits(desc_norm: str, keywords: list[str]) -> list[str]:
    found: list[str] = []
    for kw in keywords:
        kn = _normalize_text(kw)
        if kn in desc_norm:
            found.append(kw)
    return found


def _category_weight(category: str) -> int:
    c = (category or "").strip()
    if c in CAT_WEIGHT_0:
        return 0
    if c in CAT_WEIGHT_1:
        return 1
    if c in CAT_WEIGHT_2:
        return 2
    return 0


def _budget_weight(budget: float) -> int:
    if budget < 5000:
        return 0
    if 5000 <= budget <= 30000:
        return 1
    return 2


def _required_worker_types_simple(skills: list[str]) -> list[str]:
    joined = _normalize_text(" ".join(skills))
    if any(
        x in joined
        for x in ("electric", "électricite", "electricite", "courant faible", "tableau")
    ):
        return ["electricien"]
    if any(x in joined for x in ("plomb", "sanitaire", "fuite", "evacuation")):
        return ["artisan"]
    if any(x in joined for x in ("peint", "carrel", "faience", "sol")):
        return ["artisan"]
    return ["ouvrier", "artisan"]


def _required_worker_types_moyen(skills: list[str]) -> list[str]:
    joined = _normalize_text(" ".join(skills))
    if any(x in joined for x in ("electric", "électricite", "electricite")):
        return ["artisan", "electricien"]
    return ["artisan"]


def _required_worker_types_complexe(skills: list[str]) -> list[str]:
    base = ["expert", "architecte", "artisan"]
    joined = _normalize_text(" ".join(skills))
    if any(
        x in joined
        for x in (
            "electric",
            "électricite",
            "electricite",
            "courant",
            "tableau",
            "réseau électrique",
        )
    ):
        base.append("electricien")
    return base


def _build_reasoning(
    complexity: str,
    budget: float,
    category: str,
    complexe_hits: list[str],
    moyen_hits: list[str],
    surface: float | None,
    surface_bonus: bool,
) -> str:
    bud_label = "élevé" if budget > 30000 else "modéré" if budget >= 5000 else "limité"
    core = (
        f"Projet classé {complexity.upper()} : budget {bud_label} "
        f"({budget:,.0f} TND)".replace(",", " ")
    )
    if category:
        core += f", catégorie « {category} »"
    if complexe_hits:
        core += f", mots-clés détectés ({', '.join(complexe_hits[:8])})"
    elif moyen_hits:
        core += f", mots-clés détectés ({', '.join(moyen_hits[:6])})"
    if surface_bonus and surface is not None:
        core += f", surface {surface:.0f} m²"
    core += ". "
    if complexity == "complexe":
        core += (
            "Niveau élevé : intervention d'un expert, d'un architecte et d'artisans qualifiés recommandée."
        )
    elif complexity == "moyen":
        core += (
            "Niveau intermédiaire : prévoir au minimum un profil artisan, et un électricien si travaux électriques."
        )
    else:
        core += (
            "Niveau accessible : équipes ciblées (ouvrier, artisan ou électricien selon le corps de métier)."
        )
    return re.sub(r"\s+", " ", core).strip()


def analyze_project(inp: ProjectAnalysisInput) -> ProjectAnalysisOutput:
    complexity_score = 0

    # STEP 1
    complexity_score += _budget_weight(inp.budget)

    # STEP 2
    complexity_score += _category_weight(inp.category)

    # STEP 3
    desc_raw = inp.description or ""
    desc_norm = _normalize_text(desc_raw)

    complexe_hits = _keyword_hits(desc_norm, COMPLEXE_KW)
    moyen_hits = _keyword_hits(desc_norm, MOYEN_KW)
    if complexe_hits:
        complexity_score += 2
    elif moyen_hits:
        complexity_score += 1

    # STEP 4
    surface_bonus = False
    if inp.surface is not None and inp.surface > 200:
        complexity_score += 1
        surface_bonus = True

    # STEP 5
    skills = inp.required_skills or []
    if complexity_score <= 1:
        complexity = "simple"
        rwt = _required_worker_types_simple(skills)
    elif complexity_score <= 3:
        complexity = "moyen"
        rwt = _required_worker_types_moyen(skills)
    else:
        complexity = "complexe"
        rwt = _required_worker_types_complexe(skills)

    reasoning = _build_reasoning(
        complexity,
        inp.budget,
        inp.category,
        complexe_hits,
        moyen_hits,
        inp.surface,
        surface_bonus,
    )

    return ProjectAnalysisOutput(
        complexity=complexity,
        required_worker_types=rwt,
        reasoning=reasoning,
    )
