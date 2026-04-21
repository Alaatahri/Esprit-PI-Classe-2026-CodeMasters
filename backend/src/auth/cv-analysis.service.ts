import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

type PreparedCv = { kind: 'pdf'; base64: string } | { kind: 'text'; text: string };

function getAnthropicModel(): string {
  const m = process.env.ANTHROPIC_MODEL?.trim();
  return m && m.length > 3 ? m : 'claude-sonnet-4-20250514';
}

/**
 * Ordre d’essai : GEMINI_MODEL d’abord, puis alias / modèles récents.
 * Note : `gemini-1.5-flash` sans suffixe renvoie souvent 404 sur l’API actuelle ; on privilégie
 * `gemini-flash-latest` (alias maintenu par Google) et `gemini-2.5-flash`.
 */
function getGeminiModelChain(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  const extra = (process.env.GEMINI_MODEL_FALLBACKS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const defaults = [
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-002',
  ];
  const out: string[] = [];
  const push = (m: string) => {
    if (m && !out.includes(m)) {
      out.push(m);
    }
  };
  if (primary) {
    push(primary);
  }
  for (const m of defaults) {
    push(m);
  }
  for (const m of extra) {
    push(m);
  }
  return out.length ? out : defaults;
}

/** Évite d’appeler Anthropic avec une clé placeholder (ex. courte démo) → 401 systématique. */
function looksLikeRealAnthropicApiKey(key: string): boolean {
  const k = key.trim();
  return k.startsWith('sk-ant-') && k.length >= 40;
}

function isPdfMagic(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString('binary') === '%PDF';
}

function isLegacyDocMagic(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0;
}

function normalizeMime(mimeType: string): string {
  return (mimeType || '').split(';')[0].trim().toLowerCase();
}

@Injectable()
export class CvAnalysisService {
  private readonly logger = new Logger(CvAnalysisService.name);
  private anthropic: Anthropic | null = null;

  private getAnthropicClient(): Anthropic {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Analyse CV : ANTHROPIC_API_KEY absente. Utilisez GEMINI_API_KEY (Google AI Studio) ou définissez ANTHROPIC_API_KEY.',
      );
    }
    if (!this.anthropic) {
      this.anthropic = new Anthropic({ apiKey: key });
    }
    return this.anthropic;
  }

  private buildPrompt(): string {
    return `Tu es un expert RH spécialisé dans 
le secteur du BTP (Bâtiment et Travaux Publics) 
en Tunisie. Analyse ce CV pour un poste d'expert 
sur une plateforme de gestion de chantiers.

Critères obligatoires pour être compétent :
- Formation technique (génie civil, architecture,
  bâtiment, électricité, plomberie, etc.)
- Expérience professionnelle dans le secteur BTP
- Compétences techniques spécifiques au chantier
- Gestion de projets ou chantiers

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "isCompetent": true/false,
  "score": 0-100,
  "presentSkills": ["compétence1", "compétence2"],
  "missingSkills": ["manque1", "manque2"],
  "feedback": "explication courte en français"
}

Règle stricte : isCompetent = true 
UNIQUEMENT si score >= 40 ET formation BTP présente.
Sois strict et précis.`;
  }

  private async prepareCv(cvBuffer: Buffer, mimeType: string): Promise<PreparedCv> {
    const mime = normalizeMime(mimeType);

    if (isLegacyDocMagic(cvBuffer)) {
      throw new BadRequestException(
        'Le format Word .doc (ancien) n’est pas pris en charge. Enregistrez votre CV en PDF ou en DOCX.',
      );
    }

    const treatAsPdf = mime === 'application/pdf' || isPdfMagic(cvBuffer);

    if (treatAsPdf) {
      return { kind: 'pdf', base64: cvBuffer.toString('base64') };
    }

    let text: string;
    try {
      const extracted = await mammoth.extractRawText({ buffer: cvBuffer });
      text = (extracted.value || '').trim();
    } catch (e) {
      this.logger.warn(`mammoth.extractRawText: ${e}`);
      throw new BadRequestException(
        'Impossible de lire ce fichier comme DOCX. Vérifiez qu’il s’agit d’un PDF ou d’un DOCX valide.',
      );
    }
    if (text.length < 40) {
      throw new BadRequestException(
        'Le CV ne contient presque aucun texte exploitable. Envoyez un PDF ou un DOCX avec du contenu lisible.',
      );
    }

    const capped = text.length > 100_000 ? `${text.slice(0, 100_000)}\n\n[… texte tronqué …]` : text;
    return { kind: 'text', text: capped };
  }

  private parseAnalysisJson(text: string): {
    isCompetent: boolean;
    score: number;
    missingSkills: string[];
    presentSkills: string[];
    feedback: string;
  } {
    const match = text.match(/\{[\s\S]*\}/);
    const jsonText = match ? match[0] : text.trim();
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      return {
        isCompetent: !!parsed?.isCompetent,
        score: Number(parsed?.score ?? 0),
        presentSkills: Array.isArray(parsed?.presentSkills) ? (parsed.presentSkills as string[]) : [],
        missingSkills: Array.isArray(parsed?.missingSkills) ? (parsed.missingSkills as string[]) : [],
        feedback: typeof parsed?.feedback === 'string' ? parsed.feedback : '',
      };
    } catch (e) {
      this.logger.warn(`JSON analyse CV invalide: ${e} — extrait: ${jsonText.slice(0, 200)}`);
      throw new BadGatewayException(
        'La réponse du service d’analyse n’a pas pu être interprétée. Réessayez dans un instant.',
      );
    }
  }

  private toAnthropicContent(prepared: PreparedCv): Anthropic.Messages.MessageCreateParams['messages'][0]['content'] {
    const prompt = this.buildPrompt();
    if (prepared.kind === 'pdf') {
      return [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: prepared.base64,
          },
        },
        { type: 'text', text: prompt },
      ];
    }
    return [
      {
        type: 'text',
        text: `Contenu texte extrait du CV du candidat :\n\n---\n${prepared.text}\n---\n\n${prompt}`,
      },
    ];
  }

  private isGeminiQuotaOrRate(msg: string): boolean {
    return /429|RESOURCE_EXHAUSTED|quota|Quota exceeded|Too Many Requests/i.test(msg);
  }

  /** Ex. « Please retry in 56.6s » renvoyé par Google sur 429 */
  private parseGeminiRetryAfterMs(msg: string): number | null {
    const m = msg.match(/Please retry in ([0-9.]+)\s*s/i);
    if (!m) {
      return null;
    }
    const sec = Number(m[1]);
    if (!Number.isFinite(sec) || sec <= 0) {
      return null;
    }
    return Math.min(Math.ceil(sec * 1000) + 1000, 120_000);
  }

  private async generateGeminiContent(
    genAI: GoogleGenerativeAI,
    modelName: string,
    parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
  ): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: 1024 },
    });
    const result = await model.generateContent(parts);
    const out = result.response.text();
    if (!out?.trim()) {
      throw new BadGatewayException('Réponse vide du modèle Gemini.');
    }
    return out;
  }

  private async analyzeWithGemini(prepared: PreparedCv): Promise<{
    isCompetent: boolean;
    score: number;
    missingSkills: string[];
    presentSkills: string[];
    feedback: string;
  }> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY absente. Créez une clé sur https://aistudio.google.com/apikey et ajoutez-la dans backend/.env.',
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = this.buildPrompt();
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
      prepared.kind === 'pdf'
        ? [
            { inlineData: { mimeType: 'application/pdf', data: prepared.base64 } },
            { text: prompt },
          ]
        : [
            {
              text: `Contenu texte extrait du CV du candidat :\n\n---\n${prepared.text}\n---\n\n${prompt}`,
            },
          ];

    const chain = getGeminiModelChain();
    let lastMsg = '';

    const runChain = async (): Promise<string | null> => {
      for (const modelName of chain) {
        try {
          return await this.generateGeminiContent(genAI, modelName, parts);
        } catch (e: unknown) {
          if (
            e instanceof BadRequestException ||
            e instanceof BadGatewayException ||
            e instanceof ServiceUnavailableException
          ) {
            throw e;
          }
          const msg = e instanceof Error ? e.message : String(e);
          lastMsg = msg;

          if (/API key not valid|API_KEY_INVALID|401|403|permission denied|PERMISSION_DENIED/i.test(msg)) {
            throw new ServiceUnavailableException(
              'Clé GEMINI_API_KEY refusée ou invalide. Vérifiez la clé sur Google AI Studio et que l’API Generative Language est activée pour le projet.',
            );
          }

          if (/404|not found|NOT_FOUND|is not (found|supported)/i.test(msg)) {
            this.logger.warn(`Gemini modèle « ${modelName} » indisponible, essai suivant…`);
            continue;
          }

          if (this.isGeminiQuotaOrRate(msg)) {
            this.logger.warn(`Gemini « ${modelName} » : quota / limite (429), essai d’un autre modèle…`);
            continue;
          }

          this.logger.warn(`Gemini « ${modelName} » : ${msg}`);
          throw new BadGatewayException(
            'Erreur lors de l’appel à Gemini. Vérifiez GEMINI_API_KEY, GEMINI_MODEL et le format du CV (PDF ou DOCX).',
          );
        }
      }
      return null;
    };

    let text: string | null = null;
    for (let wave = 0; wave < 2; wave++) {
      text = await runChain();
      if (text != null) {
        break;
      }
      if (!this.isGeminiQuotaOrRate(lastMsg)) {
        break;
      }
      const waitMs = this.parseGeminiRetryAfterMs(lastMsg);
      if (waitMs == null) {
        break;
      }
      this.logger.warn(
        `Gemini : quota / limite ; attente ${Math.round(waitMs / 1000)}s (indication Google) puis nouvel essai (vague ${wave + 1}/2)…`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }

    if (text != null) {
      return this.parseAnalysisJson(text);
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (anthropicKey && looksLikeRealAnthropicApiKey(anthropicKey)) {
      this.logger.warn(
        'Gemini : tous les modèles essayés ont échoué ; repli Anthropic (clé sk-ant- détectée comme complète).',
      );
      try {
        return await this.analyzeWithAnthropic(prepared);
      } catch (e) {
        this.logger.warn(`Repli Anthropic impossible : ${e instanceof Error ? e.message : String(e)}`);
      }
    } else if (anthropicKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY ignorée pour l’analyse CV (clé trop courte ou non sk-ant-) — corrigez-la ou retirez-la pour éviter un faux repli.',
      );
    }

    if (this.isGeminiQuotaOrRate(lastMsg)) {
      throw new ServiceUnavailableException(
        `Quota ou limite Google (429) pour les modèles essayés (${chain.slice(0, 5).join(', ')}…). ` +
          `Actions : attendre 1–2 min ; activer la facturation / un plan sur Google Cloud (AI Studio) ; ` +
          `créer une nouvelle clé API ; définir GEMINI_MODEL=gemini-flash-latest ou GEMINI_MODEL_FALLBACKS. ` +
          `Repli Anthropic uniquement si ANTHROPIC_API_KEY est une vraie clé sk-ant- (suffisamment longue).`,
      );
    }

    throw new BadGatewayException(
      `Aucun modèle Gemini utilisable (${chain.join(', ')}). Ajustez GEMINI_MODEL / GEMINI_MODEL_FALLBACKS dans backend/.env.`,
    );
  }

  private async analyzeWithAnthropic(prepared: PreparedCv): Promise<{
    isCompetent: boolean;
    score: number;
    missingSkills: string[];
    presentSkills: string[];
    feedback: string;
  }> {
    const client = this.getAnthropicClient();
    const model = getAnthropicModel();
    const content = this.toAnthropicContent(prepared);

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      });

      const block = response.content?.[0];
      const text = block && block.type === 'text' ? block.text : '';
      if (!text.trim()) {
        throw new BadGatewayException('Réponse vide du modèle d’analyse.');
      }

      return this.parseAnalysisJson(text);
    } catch (e: unknown) {
      if (
        e instanceof BadRequestException ||
        e instanceof BadGatewayException ||
        e instanceof ServiceUnavailableException
      ) {
        throw e;
      }
      const err = e as { status?: number; message?: string };
      const status = typeof err?.status === 'number' ? err.status : 0;
      const msg = typeof err?.message === 'string' ? err.message : String(e);

      this.logger.warn(`Anthropic messages.create failed (${status}): ${msg}`);

      if (status === 401 || status === 403) {
        throw new ServiceUnavailableException(
          'Clé API Anthropic refusée (401/403). Vérifiez ANTHROPIC_API_KEY dans backend/.env, ou utilisez GEMINI_API_KEY (Google AI Studio).',
        );
      }
      if (status === 404) {
        throw new BadGatewayException(
          `Modèle ou endpoint Anthropic introuvable (404). Vérifiez ANTHROPIC_MODEL (actuellement : ${model}).`,
        );
      }
      if (status === 429) {
        throw new ServiceUnavailableException(
          'Limite de débit Anthropic atteinte. Réessayez dans quelques minutes.',
        );
      }

      throw new BadGatewayException(
        'Erreur lors de l’appel au service d’analyse CV (Anthropic). Vérifiez la clé API, le modèle et le format du fichier.',
      );
    }
  }

  async analyzeCV(
    cvBuffer: Buffer,
    mimeType: string,
  ): Promise<{
    isCompetent: boolean;
    score: number;
    missingSkills: string[];
    presentSkills: string[];
    feedback: string;
  }> {
    if (!cvBuffer?.length) {
      throw new BadRequestException('Fichier CV vide.');
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (!geminiKey && !anthropicKey) {
      throw new ServiceUnavailableException(
        'Analyse CV indisponible : définissez GEMINI_API_KEY (recommandé, Google AI Studio) ou ANTHROPIC_API_KEY dans backend/.env, puis redémarrez le serveur.',
      );
    }

    const prepared = await this.prepareCv(cvBuffer, mimeType);

    if (geminiKey) {
      return this.analyzeWithGemini(prepared);
    }
    return this.analyzeWithAnthropic(prepared);
  }
}
