const axios = require('axios');

const AI_MATCH_URL = process.env.AI_MATCHING_URL || 'http://localhost:8001/match';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Transforme un document MongoDB Expert vers le corps attendu par FastAPI.
 * @param {import('mongoose').Document} expert
 * @returns {Record<string, unknown>}
 */
function mapExpertToApiFormat(expert) {
  const o = expert.toObject ? expert.toObject() : expert;
  const loc = o.location;
  const hasLoc =
    loc &&
    typeof loc.lat === 'number' &&
    typeof loc.lng === 'number' &&
    !Number.isNaN(loc.lat) &&
    !Number.isNaN(loc.lng);

  return {
    expertId: o._id.toString(),
    skills: Array.isArray(o.skills) ? o.skills : [],
    bio: typeof o.bio === 'string' ? o.bio : '',
    rating: typeof o.rating === 'number' ? o.rating : 0,
    reviewsCount: typeof o.reviewsCount === 'number' ? o.reviewsCount : 0,
    activeProjects: typeof o.activeProjects === 'number' ? o.activeProjects : 0,
    experienceYears: typeof o.experienceYears === 'number' ? o.experienceYears : 0,
    workerType: typeof o.workerType === 'string' ? o.workerType : 'artisan',
    ...(hasLoc ? { location: { lat: loc.lat, lng: loc.lng } } : {}),
  };
}

/**
 * Transforme un document Project vers le format Python.
 * @param {import('mongoose').Document} project
 */
function mapProjectToApiFormat(project) {
  const o = project.toObject ? project.toObject() : project;
  const loc = o.location;
  const hasLoc =
    loc &&
    typeof loc.lat === 'number' &&
    typeof loc.lng === 'number' &&
    !Number.isNaN(loc.lat) &&
    !Number.isNaN(loc.lng);

  const budget = o.budget_estime ?? o.budget ?? undefined;

  return {
    description: typeof o.description === 'string' ? o.description : '',
    requiredSkills: Array.isArray(o.requiredSkills) ? o.requiredSkills : [],
    ...(hasLoc ? { location: { lat: loc.lat, lng: loc.lng } } : {}),
    ...(typeof budget === 'number' && !Number.isNaN(budget) ? { budget } : {}),
  };
}

/**
 * Filtre de secours : recouvrement des compétences requises avec les compétences expert.
 * @param {object} project — document projet (plain ou mongoose)
 * @param {object[]} experts — liste de documents Expert
 * @param {number} topN
 */
function fallbackBasicSkillFilter(project, experts, topN) {
  const p = project.toObject ? project.toObject() : project;
  const required = (p.requiredSkills || []).map((s) => String(s).toLowerCase().trim()).filter(Boolean);

  const scored = experts.map((expert) => {
    const e = expert.toObject ? expert.toObject() : expert;
    const skills = (e.skills || []).map((s) => String(s).toLowerCase().trim());

    let skillsMatch = 0;
    if (required.length === 0) {
      skillsMatch = 0.4;
    } else {
      let hits = 0;
      for (const r of required) {
        const ok = skills.some((sk) => sk === r || sk.includes(r) || r.includes(sk));
        if (ok) hits += 1;
      }
      skillsMatch = hits / required.length;
    }

    const score = Math.round(Math.max(0, Math.min(1, skillsMatch)) * 100);

    return {
      expert_id: e._id.toString(),
      score,
      breakdown: {
        skills: Number(skillsMatch.toFixed(4)),
        reputation: 0.5,
        location: 0.5,
        experience: 0.5,
        availability: 0.5,
      },
      explanation:
        'Correspondance calculée uniquement à partir du recouvrement des compétences (service IA temporairement indisponible).',
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    matches: scored.slice(0, topN),
    project_summary: '',
    source: 'fallback',
  };
}

/**
 * Appelle le service FastAPI /match ou applique le fallback.
 * @param {import('mongoose').Document} project
 * @param {import('mongoose').Document[]} experts
 * @param {number} [topN=10]
 */
async function matchProjectExperts(project, experts, topN = 10) {
  if (!experts.length) {
    return { matches: [], project_summary: '', source: 'empty' };
  }

  const body = {
    project: mapProjectToApiFormat(project),
    experts: experts.map(mapExpertToApiFormat),
    topN,
  };

  try {
    const { data } = await axios.post(AI_MATCH_URL, body, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const matches = Array.isArray(data.matches) ? data.matches : [];
    return {
      matches,
      project_summary: data.project_summary || '',
      source: 'ai',
    };
  } catch (err) {
    const fb = fallbackBasicSkillFilter(project, experts, topN);
    return {
      ...fb,
      error:
        err.code === 'ECONNABORTED'
          ? 'timeout'
          : err.response
            ? `http_${err.response.status}`
            : err.message || 'unknown',
    };
  }
}

module.exports = {
  AI_MATCH_URL,
  mapExpertToApiFormat,
  mapProjectToApiFormat,
  fallbackBasicSkillFilter,
  matchProjectExperts,
};
