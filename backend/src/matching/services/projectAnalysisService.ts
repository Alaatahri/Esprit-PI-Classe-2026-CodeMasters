type AnalysisResult = {
  complexity: 'simple' | 'medium' | 'complex';
  requiredCompetences: string[];
};

function stripMarkdownFences(raw: string): string {
  let s = raw.trim();
  s = s.replace(/```(?:json)?/gi, '');
  s = s.replace(/```/g, '');
  return s.trim();
}

function analyzeProjectLocally(description: string): AnalysisResult {
  const text = String(description ?? '').toLowerCase();

  const competenceRules: Array<{ key: string; tokens: string[] }> = [
    { key: 'peinture', tokens: ['peinture', 'peindre', 'mur', 'plafond'] },
    { key: 'carrelage', tokens: ['carrelage', 'carreaux'] },
    { key: 'plomberie', tokens: ['plomberie', 'salle de bain', 'robinet', 'canalisation'] },
    { key: 'électricité', tokens: ['électricité', 'electricite', 'electrique', 'tableau', 'câble', 'cable', 'prise'] },
    { key: 'menuiserie', tokens: ['menuiserie', 'portes', 'fenêtres', 'fenetres', 'bois'] },
    { key: 'maçonnerie', tokens: ['maçonnerie', 'maconnerie', 'murs', 'dalle', 'fondation', 'fondations'] },
    { key: 'toiture', tokens: ['toiture', 'charpente', 'étanchéité', 'etancheite'] },
    { key: 'revêtement', tokens: ['revêtement', 'revetement', 'sol', 'parquet'] },
    { key: 'rénovation', tokens: ['rénovation', 'renovation'] },
    { key: 'construction', tokens: ['construction', 'villa', 'immeuble', 'bâtiment', 'batiment'] },
  ];

  const requiredCompetences: string[] = [];
  for (const rule of competenceRules) {
    if (rule.tokens.some((t) => text.includes(t))) {
      requiredCompetences.push(rule.key);
    }
  }

  const uniq = Array.from(new Set(requiredCompetences));

  let complexity: AnalysisResult['complexity'] = 'simple';
  if (
    text.includes('villa') ||
    text.includes('construction') ||
    text.includes('fondation') ||
    text.includes('sous-sol')
  ) {
    complexity = 'complex';
  } else if (text.includes('rénovation') || text.includes('renovation') || uniq.length >= 3 || text.includes('appartement')) {
    complexity = 'medium';
  }

  return {
    complexity,
    requiredCompetences: uniq.length ? uniq : ['général'],
  };
}

export async function analyzeProject(description: string): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return analyzeProjectLocally(description);
  }

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content:
          'Tu es un expert en construction. Analyse cette description de projet et retourne UNIQUEMENT un JSON valide sans markdown ni backticks:\n' +
          '{"complexity": "simple" | "medium" | "complex", "requiredCompetences": ["competence1", "competence2"]}\n' +
          'Description: ' +
          (description ?? ''),
      },
    ],
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

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      return analyzeProjectLocally(description);
    }
    throw new Error(`Erreur Anthropic (${res.status}): ${text || res.statusText}`);
  }

  const data: any = await res.json();
  const text =
    data?.content?.find?.((c: any) => c?.type === 'text')?.text ??
    data?.content?.[0]?.text ??
    '';

  const cleaned = stripMarkdownFences(String(text));
  try {
    const parsed = JSON.parse(cleaned);
    return parsed as AnalysisResult;
  } catch (e: any) {
    throw new Error(`Impossible de parser la réponse IA en JSON: ${e?.message || e}`);
  }
}

