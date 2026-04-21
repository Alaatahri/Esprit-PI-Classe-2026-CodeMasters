type EstimateResult = {
  estimatedBudgetTnd: number;
  estimatedDurationDays: number;
  summary: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Fallback local: heuristique simple basée sur la description. */
export function estimateProjectLocally(text: string): EstimateResult {
  const s = String(text || '').toLowerCase();
  let budget = 8000;
  let days = 14;

  if (s.includes('maison') || s.includes('construction')) {
    budget += 50000;
    days += 120;
  }
  if (s.includes('renov') || s.includes('rénov')) {
    budget += 15000;
    days += 30;
  }
  if (s.includes('cuisine')) {
    budget += 6000;
    days += 10;
  }
  if (s.includes('salle de bain') || s.includes('sdb')) {
    budget += 5000;
    days += 10;
  }
  if (s.includes('plomb')) {
    budget += 2500;
    days += 5;
  }
  if (s.includes('élect') || s.includes('elect')) {
    budget += 2500;
    days += 5;
  }
  if (s.includes('peinture')) {
    budget += 1500;
    days += 4;
  }

  budget = Math.round(clamp(budget, 1500, 250000) / 100) * 100;
  days = Math.round(clamp(days, 2, 365));

  return {
    estimatedBudgetTnd: budget,
    estimatedDurationDays: days,
    summary: 'Estimation locale (fallback)',
  };
}

export type ProposalDraftResult = {
  estimatedBudgetTnd: number;
  estimatedDurationDays: number;
  technicalNotes: string;
  materialSuggestions: string;
};

/** Brouillon sans IA : cohérent avec estimateProjectLocally */
export function proposalDraftLocally(text: string): ProposalDraftResult {
  const est = estimateProjectLocally(text);
  const tn = [
    '<h2>Préambule</h2>',
    '<p>Ce brouillon est généré automatiquement (mode hors ligne). Vérifiez chaque point après visite de chantier.</p>',
    '<h2>Méthodologie et phasage</h2>',
    '<ul>',
    '<li>Relevés et validation du périmètre avec le client.</li>',
    '<li>Coordination des corps d’état et respect des normes applicables en Tunisie.</li>',
    '<li>Contrôles qualité à chaque phase livrable.</li>',
    '</ul>',
    '<h2>Planning indicatif</h2>',
    '<p>Durée indicative : <strong>' +
      String(est.estimatedDurationDays) +
      ' jours</strong> — à affiner selon délais fournisseurs et conditions d’accès au site.</p>',
    '<h2>Hypothèses et points d’attention</h2>',
    '<p>Accès chantier, horaires, stockage matériaux et reprise des existants à confirmer sur place.</p>',
  ].join('');
  return {
    estimatedBudgetTnd: est.estimatedBudgetTnd,
    estimatedDurationDays: est.estimatedDurationDays,
    technicalNotes: tn,
    materialSuggestions:
      '<p>Préciser les gammes (revêtements, équipements, étanchéité) selon le cahier des charges validé.</p>',
  };
}

/**
 * Brouillon de proposition expert : budget, durée, notes HTML (éditeur riche), matériaux.
 * JSON strict attendu du modèle.
 */
export async function generateProposalDraftWithClaudeOrFallback(
  text: string,
): Promise<ProposalDraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return proposalDraftLocally(text);

  const dossier = String(text ?? '').trim();
  if (!dossier) return proposalDraftLocally('');

  const prompt =
    'Tu es un expert en bâtiment et travaux en Tunisie. Les montants sont en TND.\n' +
    'À partir du dossier projet ci-dessous, produis UNIQUEMENT un objet JSON valide (pas de markdown, pas de texte avant ou après), avec exactement ces clés :\n' +
    '{\n' +
    '  "estimatedBudgetTnd": number,\n' +
    '  "estimatedDurationDays": number,\n' +
    '  "technicalNotes": string,\n' +
    '  "materialSuggestions": string\n' +
    '}\n' +
    'Contraintes :\n' +
    '- estimatedBudgetTnd : entier raisonnable, arrondi à 100 TND près, entre 1500 et 800000.\n' +
    '- estimatedDurationDays : entier entre 3 et 1200 (jours ouvrés indicatifs).\n' +
    '- technicalNotes : chaîne HTML **sûre** et structurée pour un éditeur riche : utiliser uniquement les balises <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>. Pas de script, pas de lien javascript. En français.\n' +
    '  Inclure au minimum : titre de synthèse (h2), méthodologie / phasage (listes à puces), planning indicatif, hypothèses, risques ou points d’attention, visites ou réunions nécessaires.\n' +
    '- materialSuggestions : court paragraphe HTML (<p>…) listant familles de matériaux ou finitions pertinentes pour ce dossier.\n' +
    '- Rester factuel et cohérent avec le niveau de détail du dossier.\n\n' +
    'Dossier projet :\n' +
    dossier;

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return proposalDraftLocally(text);

  const data: unknown = await res.json();
  const out =
    (
      data as { content?: Array<{ type?: string; text?: string }> }
    )?.content?.find?.((c) => c?.type === 'text')?.text ??
    (data as { content?: Array<{ text?: string }> })?.content?.[0]?.text ??
    '';

  const cleaned = String(out)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const budget =
      Math.round(
        clamp(Number(parsed?.estimatedBudgetTnd ?? 0), 1500, 800000) / 100,
      ) * 100;
    const days = Math.round(
      clamp(Number(parsed?.estimatedDurationDays ?? 0), 3, 1200),
    );
    let technicalNotes =
      typeof parsed?.technicalNotes === 'string' ? parsed.technicalNotes : '';
    let materialSuggestions =
      typeof parsed?.materialSuggestions === 'string'
        ? parsed.materialSuggestions
        : '';

    if (!technicalNotes.trim()) {
      technicalNotes = proposalDraftLocally(text).technicalNotes;
    }
    if (!materialSuggestions.trim()) {
      materialSuggestions = proposalDraftLocally(text).materialSuggestions;
    }

    return {
      estimatedBudgetTnd: budget,
      estimatedDurationDays: days,
      technicalNotes,
      materialSuggestions,
    };
  } catch {
    return proposalDraftLocally(text);
  }
}

/** IA via Anthropic si clé dispo, sinon fallback local. */
export async function estimateProjectWithClaudeOrFallback(
  text: string,
): Promise<EstimateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return estimateProjectLocally(text);

  const prompt =
    'Tu es un expert en construction en Tunisie. Estime un budget en TND et une durée en jours. ' +
    'Retourne UNIQUEMENT un JSON valide: {"estimatedBudgetTnd": number, "estimatedDurationDays": number, "summary": string}. ' +
    'Texte projet: ' +
    (text ?? '');

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return estimateProjectLocally(text);
  const data: any = await res.json();
  const out =
    data?.content?.find?.((c: any) => c?.type === 'text')?.text ??
    data?.content?.[0]?.text ??
    '';

  const cleaned = String(out)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    const budget =
      Math.round(
        clamp(Number(parsed?.estimatedBudgetTnd ?? 0), 1500, 500000) / 100,
      ) * 100;
    const days = Math.round(
      clamp(Number(parsed?.estimatedDurationDays ?? 0), 2, 3650),
    );
    const summary =
      typeof parsed?.summary === 'string' ? parsed.summary : 'Estimation IA';
    return { estimatedBudgetTnd: budget, estimatedDurationDays: days, summary };
  } catch {
    return estimateProjectLocally(text);
  }
}
