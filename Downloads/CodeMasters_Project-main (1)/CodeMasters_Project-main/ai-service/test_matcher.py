"""
test_matcher.py – Validation du matching avec le vrai schéma BMP.tn
Lancer : python test_matcher.py
"""
from matcher import ExpertMatcher
import json

matcher = ExpertMatcher()

# Simule un projet BMP.tn (champs du schéma Project NestJS)
projet = {
    "titre":                "Rénovation salle de bain",
    "description":          "Travaux de plomberie, pose de carrelage mural et sol, peinture",
    "competences_requises": ["plomberie", "carrelage", "peinture"],
    "budget_estime":        8000,
}

# Simule des users avec role='expert'/'artisan' (schéma User NestJS + stats calculées)
experts = [
    {
        "id": "665000000000000000000001",
        "nom": "Ahmed Ben Ali",
        "email": "ahmed@bmp.tn",
        "role": "expert",
        "competences": ["plomberie", "sanitaire", "tuyauterie"],
        "rating_moyen": 4.8,
        "nombre_avis": 32,
        "projets_termines": 45,
    },
    {
        "id": "665000000000000000000002",
        "nom": "Mohamed Trabelsi",
        "email": "mohamed@bmp.tn",
        "role": "artisan",
        "competences": ["carrelage", "faïence", "maçonnerie", "plomberie"],
        "rating_moyen": 4.2,
        "nombre_avis": 18,
        "projets_termines": 28,
    },
    {
        "id": "665000000000000000000003",
        "nom": "Sami Karray",
        "email": "sami@bmp.tn",
        "role": "artisan",
        "competences": ["peinture", "enduit", "décoration intérieure"],
        "rating_moyen": 3.9,
        "nombre_avis": 10,
        "projets_termines": 15,
    },
    {
        "id": "665000000000000000000004",
        "nom": "Khaled Mansouri",
        "email": "khaled@bmp.tn",
        "role": "expert",
        "competences": ["electricite", "câblage", "domotique"],
        "rating_moyen": 4.6,
        "nombre_avis": 40,
        "projets_termines": 60,
    },
    {
        "id": "665000000000000000000005",
        "nom": "Yassine Gharbi",
        "email": "yassine@bmp.tn",
        "role": "expert",
        "competences": ["plomberie", "carrelage", "peinture", "maçonnerie"],
        "rating_moyen": 4.9,
        "nombre_avis": 55,
        "projets_termines": 80,
    },
    {
        "id": "665000000000000000000006",
        "nom": "Ines Mbarki",
        "email": "ines@bmp.tn",
        "role": "expert",
        "competences": ["architecture", "conception", "plans"],
        "rating_moyen": 4.7,
        "nombre_avis": 25,
        "projets_termines": 30,
    },
]

# ── TEST 1 : Matching top 3 ──────────────────────────────────────────────────
print("=" * 65)
print("  TEST 1 – MATCHING TOP 3")
print("=" * 65)
print(f"  Projet  : {projet['titre']}")
print(f"  Skills  : {projet['competences_requises']}")
print(f"  Budget  : {projet['budget_estime']} TND\n")

resultats = matcher.match(projet, experts, top_n=3)

for i, e in enumerate(resultats, 1):
    print(f"  #{i} {e['nom']} ({e['role']})")
    print(f"      Score      : {e['pourcentage']}% → {e['recommandation']}")
    print(f"      Compétences: {e['competences']}")
    print(f"      Matchées   : {e['competences_matchees']}")
    print(f"      Rating     : {e['rating_moyen']} ⭐ ({e['nombre_avis']} avis)")
    print(f"      Projets    : {e['projets_termines']} terminés")
    print()

# ── TEST 2 : Explication détaillée du meilleur ──────────────────────────────
print("=" * 65)
print("  TEST 2 – EXPLICATION DÉTAILLÉE (meilleur expert)")
print("=" * 65)
best_id = resultats[0]["expert_id"]
best_raw = next(e for e in experts if e["id"] == best_id)
explication = matcher.expliquer(projet, best_raw)
print(json.dumps(explication, indent=2, ensure_ascii=False))

# ── TEST 3 : Expert hors domaine ─────────────────────────────────────────────
print("\n" + "=" * 65)
print("  TEST 3 – EXPERT HORS DOMAINE (électricien sur projet plomberie)")
print("=" * 65)
elec = next(e for e in experts if e["id"] == "665000000000000000000004")
score = matcher.match(projet, [elec], top_n=1)
print(f"  {elec['nom']} → {score[0]['pourcentage']}% | {score[0]['recommandation']}")
print(f"  Matchées : {score[0]['competences_matchees']}")

# ── TEST 4 : Expert sans compétences renseignées ─────────────────────────────
print("\n" + "=" * 65)
print("  TEST 4 – EXPERT SANS COMPÉTENCES (nouveau sur la plateforme)")
print("=" * 65)
nouveau = {
    "id": "665000000000000000000099",
    "nom": "Nouveau Expert",
    "email": "nouveau@bmp.tn",
    "role": "expert",
    "competences": [],
    "rating_moyen": 0,
    "nombre_avis": 0,
    "projets_termines": 0,
}
score_nouveau = matcher.match(projet, [nouveau], top_n=1)
print(f"  {nouveau['nom']} → {score_nouveau[0]['pourcentage']}% | {score_nouveau[0]['recommandation']}")
