"""
BMP.tn – AI Expert Matching Service
Port : 5001
Appelé par le backend NestJS via HTTP
"""

from flask import Flask, request, jsonify
from matcher import ExpertMatcher
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

matcher = ExpertMatcher()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "BMP.tn AI Matching", "port": 5001})


@app.route("/api/match-experts", methods=["POST"])
def match_experts():
    """
    Body JSON attendu depuis NestJS :
    {
      "projet": {
        "titre": "Rénovation appartement",
        "description": "Travaux de plomberie et carrelage",
        "competences_requises": ["plomberie", "carrelage"],
        "budget_estime": 8000
      },
      "experts": [
        {
          "id": "665abc123...",
          "nom": "Ahmed Ben Ali",
          "email": "ahmed@example.com",
          "role": "expert",
          "competences": ["plomberie", "sanitaire"],
          "rating_moyen": 4.5,
          "nombre_avis": 20,
          "projets_termines": 35
        }
      ],
      "top_n": 3
    }
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Corps JSON manquant"}), 400

        projet  = data.get("projet")
        experts = data.get("experts", [])
        top_n   = int(data.get("top_n", 3))

        if not projet:
            return jsonify({"error": "Champ 'projet' requis"}), 400
        if not experts:
            return jsonify({"error": "Champ 'experts' requis (liste non vide)"}), 400

        resultats = matcher.match(projet, experts, top_n)

        logger.info(
            f"Matching: projet='{projet.get('titre')}' | "
            f"{len(experts)} candidats → top {top_n}"
        )

        return jsonify({
            "success":  True,
            "titre_projet":    projet.get("titre"),
            "experts_matches": resultats,
            "total_candidats": len(experts),
        })

    except Exception as e:
        logger.error(f"Erreur /match-experts : {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/expliquer-match", methods=["POST"])
def expliquer_match():
    """
    Retourne le détail complet du score pour UN expert.
    Body : { "projet": {...}, "expert": {...} }
    """
    try:
        data    = request.get_json(silent=True)
        projet  = data.get("projet")
        expert  = data.get("expert")

        if not projet or not expert:
            return jsonify({"error": "'projet' et 'expert' sont requis"}), 400

        explication = matcher.expliquer(projet, expert)
        return jsonify({"success": True, "explication": explication})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🤖 BMP.tn AI Matching Service démarré sur http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=True)
