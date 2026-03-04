"""
BMP.tn – Expert Matching Engine
Adapté au schéma User NestJS :
  { nom, email, role, telephone }
  + compétences et rating calculés depuis les projets
"""

import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------------------------
# Domaines métier du secteur construction (Tunisie)
# ---------------------------------------------------------------------------
DOMAINES_CONSTRUCTION = {
    "plomberie":       ["sanitaire", "tuyauterie", "eau", "robinetterie", "chauffe-eau"],
    "electricite":     ["câblage", "tableau électrique", "domotique", "éclairage"],
    "carrelage":       ["faïence", "mosaïque", "revêtement sol", "pose carrelage"],
    "maconnerie":      ["gros oeuvre", "béton", "parpaing", "coffrage", "fondation"],
    "peinture":        ["enduit", "ravalement", "décoration intérieure"],
    "menuiserie":      ["bois", "charpente", "porte", "fenêtre", "parquet"],
    "climatisation":   ["hvac", "ventilation", "chauffage", "clim", "pompe chaleur"],
    "toiture":         ["couverture", "étanchéité", "zinguerie", "terrasse"],
    "isolation":       ["thermique", "phonique", "combles", "laine de verre"],
    "terrassement":    ["excavation", "nivellement", "voirie", "assainissement"],
    "architecture":    ["conception", "plans", "permis construire", "bureau étude"],
    "renovation":      ["rénovation", "réhabilitation", "remise en état"],
}


class ExpertMatcher:
    """
    Score de matching pondéré :
      - Similarité compétences (TF-IDF + matching exact) : 55 %
      - Rating moyen (0–5)                               : 30 %
      - Expérience (projets terminés + avis)             : 15 %
    """

    POIDS = {
        "competences": 0.55,
        "rating":      0.30,
        "experience":  0.15,
    }

    def __init__(self):
        self.vectorizer = TfidfVectorizer(analyzer="word", ngram_range=(1, 2))

    # -----------------------------------------------------------------------
    # API publique
    # -----------------------------------------------------------------------

    def match(self, projet: dict, experts: list[dict], top_n: int = 3) -> list[dict]:
        """
        Retourne les top_n experts triés par score décroissant.

        Chaque expert attendu :
        {
          "id": str,           # _id MongoDB
          "nom": str,          # champ 'nom' du schéma User
          "email": str,
          "role": str,         # 'expert' | 'artisan'
          "competences": [],   # liste de strings (spécialités)
          "rating_moyen": float,
          "nombre_avis": int,
          "projets_termines": int
        }
        """
        resultats = []
        for expert in experts:
            detail = self._calculer_score(projet, expert)
            resultats.append({
                "expert_id":        expert.get("id"),
                "nom":              expert.get("nom"),
                "email":            expert.get("email"),
                "role":             expert.get("role"),
                "competences":      expert.get("competences", []),
                "rating_moyen":     expert.get("rating_moyen", 0),
                "nombre_avis":      expert.get("nombre_avis", 0),
                "projets_termines": expert.get("projets_termines", 0),
                "score":            round(detail["total"], 4),
                "pourcentage":      round(detail["total"] * 100, 1),
                "competences_matchees": detail["competences_matchees"],
                "detail_scores":    detail["detail"],
                "recommandation":   self._label(detail["total"]),
            })

        resultats.sort(key=lambda x: x["score"], reverse=True)
        return resultats[:top_n]

    def expliquer(self, projet: dict, expert: dict) -> dict:
        """Détail complet du score pour un expert."""
        detail = self._calculer_score(projet, expert)
        manquantes = list(
            set(projet.get("competences_requises", [])) -
            set(expert.get("competences", []))
        )
        return {
            "expert_nom":           expert.get("nom"),
            "score_total":          round(detail["total"], 4),
            "pourcentage":          round(detail["total"] * 100, 1),
            "competences_matchees": detail["competences_matchees"],
            "competences_manquantes": manquantes,
            "competences_requises": projet.get("competences_requises", []),
            "competences_expert":   expert.get("competences", []),
            "detail_scores":        detail["detail"],
            "poids_utilises":       self.POIDS,
        }

    # -----------------------------------------------------------------------
    # Calcul interne
    # -----------------------------------------------------------------------

    def _calculer_score(self, projet: dict, expert: dict) -> dict:
        score_comp, matchees = self._score_competences(projet, expert)
        score_rating         = self._score_rating(expert)
        score_experience     = self._score_experience(expert)

        total = (
            score_comp       * self.POIDS["competences"] +
            score_rating     * self.POIDS["rating"] +
            score_experience * self.POIDS["experience"]
        )

        return {
            "total": min(total, 1.0),
            "competences_matchees": matchees,
            "detail": {
                "competences": {
                    "score_brut":   round(score_comp, 4),
                    "score_pondere": round(score_comp * self.POIDS["competences"], 4),
                    "poids":        self.POIDS["competences"],
                },
                "rating": {
                    "score_brut":    round(score_rating, 4),
                    "score_pondere": round(score_rating * self.POIDS["rating"], 4),
                    "poids":         self.POIDS["rating"],
                    "rating_reel":   expert.get("rating_moyen", 0),
                    "nombre_avis":   expert.get("nombre_avis", 0),
                },
                "experience": {
                    "score_brut":       round(score_experience, 4),
                    "score_pondere":    round(score_experience * self.POIDS["experience"], 4),
                    "poids":            self.POIDS["experience"],
                    "projets_termines": expert.get("projets_termines", 0),
                },
            },
        }

    def _enrichir_competences(self, competences: list[str]) -> list[str]:
        """Ajoute les synonymes pour enrichir la comparaison TF-IDF."""
        enrichies = list(competences)
        for comp in competences:
            comp_lower = comp.lower()
            for domaine, synonymes in DOMAINES_CONSTRUCTION.items():
                if comp_lower == domaine or comp_lower in synonymes:
                    enrichies.extend(synonymes)
                    enrichies.append(domaine)
        return list(set(s.lower() for s in enrichies))

    def _score_competences(self, projet: dict, expert: dict) -> tuple[float, list]:
        requises  = projet.get("competences_requises", [])
        existantes = expert.get("competences", [])
        description = projet.get("description", "")

        if not requises:
            return 0.5, []

        # Matching exact (60 % du score compétences)
        matchees = [r for r in requises if r.lower() in [e.lower() for e in existantes]]
        score_exact = len(matchees) / len(requises)

        # TF-IDF cosine similarity (40 % du score compétences)
        req_enrichies    = self._enrichir_competences(requises)
        expert_enrichies = self._enrichir_competences(existantes)
        texte_projet  = " ".join(req_enrichies) + " " + description
        texte_expert  = " ".join(expert_enrichies)

        try:
            tfidf = self.vectorizer.fit_transform([texte_projet, texte_expert])
            cosine = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
        except Exception:
            cosine = 0.0

        score_final = (score_exact * 0.6) + (cosine * 0.4)
        return min(score_final, 1.0), matchees

    def _score_rating(self, expert: dict) -> float:
        rating = float(expert.get("rating_moyen", 0))
        avis   = int(expert.get("nombre_avis", 0))
        if rating == 0:
            return 0.0
        base  = rating / 5.0
        bonus = min(avis / 50, 1.0) * 0.10   # bonus confiance max +10 %
        return min(base + bonus, 1.0)

    def _score_experience(self, expert: dict) -> float:
        projets = int(expert.get("projets_termines", 0))
        avis    = int(expert.get("nombre_avis", 0))
        # Échelle logarithmique : 50 projets → score max
        s_projets = min(math.log1p(projets) / math.log1p(50), 1.0)
        s_avis    = min(math.log1p(avis)    / math.log1p(100), 1.0)
        return (s_projets * 0.6) + (s_avis * 0.4)

    def _label(self, score: float) -> str:
        if score >= 0.80:
            return "Excellent match ⭐⭐⭐"
        elif score >= 0.60:
            return "Bon match ⭐⭐"
        elif score >= 0.40:
            return "Match acceptable ⭐"
        return "Match faible"
