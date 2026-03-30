"""Modèles Pydantic pour la requête /match et les réponses."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class Location(BaseModel):
    """Coordonnées géographiques WGS84."""

    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")


class ProjectInput(BaseModel):
    """Projet à matcher (aligné sur le domaine BMP.tn)."""

    model_config = {"populate_by_name": True}

    description: str = Field(
        ...,
        min_length=0,
        description="Description du projet",
    )
    required_skills: list[str] = Field(
        default_factory=list,
        alias="requiredSkills",
        description="Compétences requises",
    )
    location: Location | None = Field(
        default=None,
        description="Localisation du projet (optionnelle)",
    )
    budget: float | None = Field(
        default=None,
        ge=0,
        description="Budget estimé",
    )

    @field_validator("required_skills", mode="before")
    @classmethod
    def normalize_skills(cls, v: object) -> list[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        return [str(s).strip() for s in v if str(s).strip()]


class ExpertInput(BaseModel):
    """Expert / travailleur candidat au matching."""

    model_config = {"populate_by_name": True}

    expert_id: str = Field(..., alias="expertId", min_length=1)
    skills: list[str] = Field(default_factory=list)
    bio: str = Field(default="", max_length=50_000)
    rating: float = Field(default=0.0, ge=0, le=5)
    reviews_count: int = Field(default=0, ge=0, alias="reviewsCount")
    active_projects: int = Field(default=0, ge=0, alias="activeProjects")
    experience_years: int = Field(default=0, ge=0, alias="experienceYears")
    worker_type: str = Field(default="artisan", alias="workerType")
    location: Location | None = None

    @field_validator("skills", mode="before")
    @classmethod
    def normalize_skills(cls, v: object) -> list[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        return [str(s).strip() for s in v if str(s).strip()]


class MatchRequest(BaseModel):
    """Corps POST /match."""

    model_config = {"populate_by_name": True}

    project: ProjectInput
    experts: list[ExpertInput] = Field(..., min_length=1)
    top_n: int = Field(default=10, ge=1, le=500, alias="topN")
    required_worker_types: list[str] = Field(
        default_factory=list,
        alias="requiredWorkerTypes",
        description="Si non vide, seuls ces worker_type sont notés et retournés.",
    )


class ScoreBreakdown(BaseModel):
    """Sous-scores normalisés entre 0 et 1."""

    skills: float = Field(..., ge=0, le=1)
    reputation: float = Field(..., ge=0, le=1)
    location: float = Field(..., ge=0, le=1)
    experience: float = Field(..., ge=0, le=1)
    availability: float = Field(..., ge=0, le=1)


class MatchResultItem(BaseModel):
    """Un expert classé avec score et explication."""

    expert_id: str
    score: float = Field(..., ge=0, le=100, description="Score final sur 100")
    breakdown: ScoreBreakdown
    explanation: str = Field(..., description="Justification en français")


class MatchResponse(BaseModel):
    """Réponse POST /match."""

    matches: list[MatchResultItem]
    project_summary: str = Field(
        default="",
        description="Aperçu texte utilisé pour le calcul TF-IDF",
    )


class HealthResponse(BaseModel):
    """GET /health."""

    status: str = "ok"
    service: str = "ai-expert-matching"


class ProjectAnalysisInput(BaseModel):
    """Corps POST /analyze-project."""

    model_config = {"populate_by_name": True}

    description: str = ""
    category: str = ""
    budget: float = Field(..., ge=0)
    surface: float | None = Field(default=None, ge=0)
    required_skills: list[str] = Field(default_factory=list, alias="requiredSkills")

    @field_validator("required_skills", mode="before")
    @classmethod
    def normalize_skills(cls, v: object) -> list[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        return [str(s).strip() for s in v if str(s).strip()]


class ProjectAnalysisOutput(BaseModel):
    """Réponse POST /analyze-project."""

    model_config = {"populate_by_name": True}

    complexity: str
    required_worker_types: list[str] = Field(
        ...,
        alias="requiredWorkerTypes",
    )
    reasoning: str
