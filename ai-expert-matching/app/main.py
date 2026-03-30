"""Microservice FastAPI — matching experts / projets (BMP.tn)."""

from __future__ import annotations

from fastapi import FastAPI

from app.models import (
    HealthResponse,
    MatchRequest,
    MatchResponse,
    MatchResultItem,
    ProjectAnalysisInput,
    ProjectAnalysisOutput,
)
from app.project_analysis import analyze_project
from app.scoring import french_explanation, score_expert

app = FastAPI(
    title="AI Expert Matching",
    description="Service de classement d'experts pour la plateforme BMP.tn",
    version="1.0.0",
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/analyze-project", response_model=ProjectAnalysisOutput, tags=["analysis"])
def analyze_project_endpoint(body: ProjectAnalysisInput) -> ProjectAnalysisOutput:
    return analyze_project(body)


def _filter_experts_by_worker_type(
    experts: list,
    required_worker_types: list[str],
) -> list:
    if not required_worker_types:
        return list(experts)
    allowed = {str(w).strip().lower() for w in required_worker_types if str(w).strip()}
    if not allowed:
        return list(experts)
    out: list = []
    for e in experts:
        wt = (e.worker_type or "artisan").strip().lower()
        if wt in allowed:
            out.append(e)
    return out


@app.post("/match", response_model=MatchResponse, tags=["matching"])
def match_experts(body: MatchRequest) -> MatchResponse:
    candidates = _filter_experts_by_worker_type(
        body.experts,
        body.required_worker_types,
    )

    results: list[tuple[float, MatchResultItem]] = []

    for expert in candidates:
        score_100, breakdown, dist_km = score_expert(body.project, expert)
        explanation = french_explanation(breakdown, dist_km)
        item = MatchResultItem(
            expert_id=expert.expert_id,
            score=score_100,
            breakdown=breakdown,
            explanation=explanation,
        )
        results.append((score_100, item))

    results.sort(key=lambda x: x[0], reverse=True)
    top = [item for _, item in results[: body.top_n]]

    p_desc = (body.project.description or "").strip()
    skills = " ".join(body.project.required_skills)
    summary = f"{p_desc} {skills}".strip()

    return MatchResponse(matches=top, project_summary=summary[:500])
