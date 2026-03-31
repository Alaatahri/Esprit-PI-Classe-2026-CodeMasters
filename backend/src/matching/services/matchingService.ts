type ScoredExpert = {
  _id: any;
  prenom?: string;
  nom: string;
  email: string;
  telephone?: string;
  competences?: string[];
  isAvailable?: boolean;
  rating?: number;
  experienceYears?: number;
  score: number;
};

function norm(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

export async function findBestExperts(
  requiredCompetences: string[],
  userModel: { find: (q: any) => any },
  limit = 5,
): Promise<ScoredExpert[]> {
  const required = Array.isArray(requiredCompetences)
    ? requiredCompetences.map(norm).filter(Boolean)
    : [];

  if (required.length === 0) return [];

  const experts: any[] = await userModel
    .find({
      role: 'expert',
      $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }],
    })
    .lean()
    .exec();

  const scored = experts
    .map((expert) => {
      const expertCompetences: string[] = Array.isArray(expert?.competences)
        ? expert.competences.map(norm).filter(Boolean)
        : [];

      let matchedCount = 0;
      for (const req of required) {
        if (expertCompetences.includes(req)) matchedCount++;
      }

      const competenceScore = (matchedCount / required.length) * 60;
      const rating = Number(expert?.rating ?? 0);
      const ratingScore = (Math.max(0, Math.min(5, rating)) / 5) * 25;

      const years = Number(expert?.experienceYears ?? 0);
      const cappedYears = Math.min(Math.max(0, years), 10);
      const experienceScore = (cappedYears / 10) * 15;

      const totalScore = competenceScore + ratingScore + experienceScore;
      const score = Math.round(totalScore * 10) / 10;

      const out: ScoredExpert = {
        _id: expert?._id,
        prenom: expert?.prenom,
        nom: expert?.nom,
        email: expert?.email,
        telephone: expert?.telephone,
        competences: expert?.competences,
        isAvailable: expert?.isAvailable,
        rating: expert?.rating,
        experienceYears: expert?.experienceYears,
        score,
      };

      return { out, competenceScore };
    })
    .filter((x) => x.competenceScore > 0)
    .sort((a, b) => b.out.score - a.out.score)
    .slice(0, limit)
    .map((x) => x.out);

  return scored;
}

