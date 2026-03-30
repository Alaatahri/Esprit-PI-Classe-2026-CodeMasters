"""Algorithme de score : TF-IDF, réputation, distance, expérience, disponibilité."""

from __future__ import annotations

import math
import re

from geopy.distance import geodesic
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import ExpertInput, ProjectInput, ScoreBreakdown

# Pondérations (total = 1.0)
W_SKILLS = 0.35
W_REPUTATION = 0.25
W_LOCATION = 0.20
W_EXPERIENCE = 0.15
W_AVAILABILITY = 0.05

# Référence pour normaliser les avis (au-delà, gain marginal)
REVIEWS_HALF_SATURATION = 15.0
# Distance (km) à partir de laquelle le score de proximité est très faible
LOCATION_DECAY_KM = 400.0
# Charge de travail : au-delà, disponibilité proche de 0
ACTIVE_PROJECTS_CAP = 12


def _project_text(project: ProjectInput) -> str:
    skills_part = " ".join(project.required_skills)
    desc = (project.description or "").strip()
    return f"{desc} {skills_part}".strip()


def _expert_text(expert: ExpertInput) -> str:
    skills_part = " ".join(expert.skills)
    bio = (expert.bio or "").strip()
    return f"{bio} {skills_part}".strip()


def tfidf_cosine_similarity(doc_a: str, doc_b: str) -> float:
    """Similarité cosinus TF-IDF entre deux textes, bornée à [0, 1]."""
    a = doc_a.strip() if doc_a else ""
    b = doc_b.strip() if doc_b else ""
    if not a and not b:
        return 0.0
    if not a:
        a = " "
    if not b:
        b = " "

    try:
        vectorizer = TfidfVectorizer(
            min_df=1,
            token_pattern=r"(?u)\b\w+\b",
            lowercase=True,
        )
        matrix = vectorizer.fit_transform([a, b])
        if matrix.shape[0] < 2:
            return 0.0
        sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        if math.isnan(sim):
            return 0.0
        return float(max(0.0, min(1.0, sim)))
    except (ValueError, TypeError):
        return 0.0


def reputation_score(rating: float, reviews_count: int) -> float:
    """
    Combine note moyenne (0-5) et volume d'avis.
    Sans avis : la note seule compte avec un léger pénalisant implicite via reviews.
    """
    r = max(0.0, min(5.0, float(rating)))
    rating_part = r / 5.0
    rc = max(0, int(reviews_count))
    reviews_part = rc / (rc + REVIEWS_HALF_SATURATION)
    return float(max(0.0, min(1.0, 0.62 * rating_part + 0.38 * reviews_part)))


def score_experience(experience_years: int) -> float:
    """Score d'expérience dans [0, 1]."""
    y = max(0, int(experience_years))
    if y == 0:
        return 0.3
    if y <= 2:
        return 0.5
    if y <= 5:
        return 0.7
    if y <= 10:
        return 0.85
    if y <= 20:
        return 0.95
    return 1.0


def location_score(
    project_loc: tuple[float, float] | None,
    expert_loc: tuple[float, float] | None,
) -> float:
    """
    Score de proximité [0, 1]. Si une localisation manque : score neutre 0.5.
    """
    if project_loc is None or expert_loc is None:
        return 0.5

    dist_km = geodesic(
        (project_loc[0], project_loc[1]),
        (expert_loc[0], expert_loc[1]),
    ).km
    s = 1.0 / (1.0 + dist_km / LOCATION_DECAY_KM)
    return float(max(0.0, min(1.0, s)))


def availability_score(active_projects: int) -> float:
    """Moins de projets actifs = meilleure disponibilité (normalisé [0, 1])."""
    ap = max(0, int(active_projects))
    s = 1.0 - min(1.0, ap / float(ACTIVE_PROJECTS_CAP))
    return float(max(0.0, min(1.0, s)))


def french_explanation(
    breakdown: ScoreBreakdown,
    distance_km: float | None,
) -> str:
    sentences: list[str] = []

    sm = breakdown.skills
    if sm >= 0.75:
        sentences.append(
            "L'adéquation textuelle (description, compétences) avec le projet est très forte."
        )
    elif sm >= 0.45:
        sentences.append(
            "Le profil présente une bonne correspondance partielle avec les besoins du projet."
        )
    else:
        sentences.append(
            "La correspondance des compétences et du contenu textuel reste limitée par rapport au projet."
        )

    rep = breakdown.reputation
    if rep >= 0.7:
        sentences.append(
            "La réputation est excellente, avec une note solide et un historique d'avis crédible."
        )
    elif rep >= 0.4:
        sentences.append(
            "La réputation est correcte ; la note et/ou le nombre d'avis peuvent encore progresser."
        )
    else:
        sentences.append(
            "La réputation est modeste (peu d'avis ou note encore basse) ; à considérer avec prudence."
        )

    loc = breakdown.location
    if distance_km is not None:
        if loc >= 0.65:
            sentences.append(
                f"La proximité géographique est favorable (environ {distance_km:.0f} km)."
            )
        elif loc >= 0.35:
            sentences.append(
                f"La distance reste acceptable (environ {distance_km:.0f} km) pour une collaboration."
            )
        else:
            sentences.append(
                f"L'éloignement est important (environ {distance_km:.0f} km), ce qui peut impacter la logistique."
            )
    else:
        sentences.append(
            "La localisation n'a pas pu être prise en compte précisément (données manquantes) ; un score neutre a été appliqué pour ce critère."
        )

    exp = breakdown.experience
    if exp >= 0.85:
        sentences.append(
            "L'expérience professionnelle est très solide (nombre d'années élevé)."
        )
    elif exp >= 0.55:
        sentences.append(
            "L'expérience est correcte et adaptée à des chantiers de complexité moyenne."
        )
    else:
        sentences.append(
            "L'expérience reste limitée ou peu documentée ; à surveiller sur les projets exigeants."
        )

    av = breakdown.availability
    if av >= 0.7:
        sentences.append("La disponibilité semble bonne (peu de projets actifs en parallèle).")
    elif av >= 0.35:
        sentences.append(
            "La charge actuelle est modérée ; l'expert a déjà plusieurs dossiers en cours."
        )
    else:
        sentences.append(
            "La disponibilité est serrée : beaucoup de projets actifs, ce qui peut retarder la prise en charge."
        )

    text = " ".join(sentences)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def compute_distance_km(
    project_loc: tuple[float, float] | None,
    expert_loc: tuple[float, float] | None,
) -> float | None:
    if project_loc is None or expert_loc is None:
        return None
    return float(
        geodesic(
            (project_loc[0], project_loc[1]),
            (expert_loc[0], expert_loc[1]),
        ).km
    )


def score_expert(
    project: ProjectInput,
    expert: ExpertInput,
) -> tuple[float, ScoreBreakdown, float | None]:
    """
    Retourne (score sur 100, breakdown, distance_km ou None pour l'explication).
    """
    p_text = _project_text(project)
    e_text = _expert_text(expert)
    skills = tfidf_cosine_similarity(p_text, e_text)

    rep = reputation_score(expert.rating, expert.reviews_count)

    pl = (
        (project.location.lat, project.location.lng) if project.location else None
    )
    el = (expert.location.lat, expert.location.lng) if expert.location else None
    loc = location_score(pl, el)
    dist_km = compute_distance_km(pl, el)

    exp = score_experience(expert.experience_years)
    avail = availability_score(expert.active_projects)

    breakdown = ScoreBreakdown(
        skills=skills,
        reputation=rep,
        location=loc,
        experience=exp,
        availability=avail,
    )

    total = (
        W_SKILLS * skills
        + W_REPUTATION * rep
        + W_LOCATION * loc
        + W_EXPERIENCE * exp
        + W_AVAILABILITY * avail
    )
    score_100 = round(100.0 * max(0.0, min(1.0, total)), 2)
    return score_100, breakdown, dist_km
