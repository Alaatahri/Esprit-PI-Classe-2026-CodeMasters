import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../alerts/notifications.service';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import { ProjectService } from '../project/project.service';
import { Suivi, SuiviDocument } from './schemas/suivi.schema';

type ClaudeResult = {
  percent: number;
  reason: string;
  raw: string;
  hasProgression: boolean;
  hasDelay: boolean;
  delayReason: string | null;
};

@Injectable()
export class SuiviService implements OnModuleInit {
  constructor(
    @InjectModel(Suivi.name) private readonly suiviModel: Model<SuiviDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly projectService: ProjectService,
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    const key = this.getAnthropicApiKey();
    console.log(`[SuiviService] ANTHROPIC_API_KEY utilisable : ${!!key}`);
    if (!key) {
      console.warn(
        '[SuiviService] ⚠️  Aucune clé Anthropic valide — mode hors ligne possible (voir SUIVI_OFFLINE_PROGRESS_PER_PHOTO).',
      );
    } else {
      console.log(
        `[SuiviService] Clé API chargée (${key.length} caractères). Modèle : ${this.getAnthropicModel()}`,
      );
    }
    if (process.env.NODE_ENV !== 'production') {
      const authDemoOff =
        process.env.SUIVI_OFFLINE_ON_AUTH_ERROR === '0' ||
        process.env.SUIVI_OFFLINE_ON_AUTH_ERROR === 'false';
      if (!authDemoOff) {
        console.log(
          '[SuiviService] Démo : en cas de clé Anthropic absente ou 401/403, +5 % / photo (hors prod). Désactiver : SUIVI_OFFLINE_ON_AUTH_ERROR=false',
        );
      }
    }
    const explicit = process.env.SUIVI_OFFLINE_PROGRESS_PER_PHOTO;
    if (explicit !== undefined && String(explicit).trim() !== '') {
      console.log(
        `[SuiviService] SUIVI_OFFLINE_PROGRESS_PER_PHOTO=${explicit} — incrément forcé sur erreurs éligibles.`,
      );
    }
    const p = this.getSuiviAiProvider();
    console.log(
      `[SuiviService] Fournisseur IA suivi photo : ${p} (Ollama ${this.getOllamaBaseUrl()}, modèle ${this.getOllamaModel()})`,
    );
  }

  private clientIdFromProject(project: Record<string, unknown>): string {
    const c = project?.clientId as unknown;
    if (c && typeof c === 'object' && c !== null && '_id' in c) {
      return String((c as { _id?: unknown })._id ?? '');
    }
    return String(c ?? '');
  }

  /**
   * Crée une entrée de suivi photo pour un projet.
   * Applique les règles:
   * - progressPercent global par projet, non décroissant
   * - progressIndex auto-incrément par projet
   * - analyse IA via Claude si `ANTHROPIC_API_KEY` est défini, sinon fallback
   *
   * @param input Données requises (projectId, workerId, photoUrl) + photoBase64 optionnel
   * @returns Document créé et résultat IA (percent/reason)
   */
  async createPhotoProgress(input: {
    projectId: string;
    workerId: string;
    photoUrl: string;
    photoBase64?: string;
    comment?: string;
    uploadedAt?: string | Date;
  }) {
    const projectId = String(input?.projectId || '').trim();
    const workerId = String(input?.workerId || '').trim();
    const photoUrl = String(input?.photoUrl || '').trim();
    const photoBase64 =
      typeof input?.photoBase64 === 'string'
        ? input.photoBase64.trim()
        : undefined;

    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('projectId invalide');
    }
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestException('workerId invalide');
    }
    if (!photoUrl) {
      throw new BadRequestException('photoUrl est requis');
    }

    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException('Projet introuvable');

    const projectLean = project as Record<string, unknown>;

    // Règles de progress: récupérer max actuel sur ce projet (compat avec anciens champs)
    const currentMax = await this.getCurrentMaxProgressPercent(projectId);

    // Index: total entrées existantes + 1
    const progressIndex =
      (await this.suiviModel
        .countDocuments({ projectId: new Types.ObjectId(projectId) })
        .exec()) + 1;

    const ai = await this.analyzePhotoWithAiOrFallback({
      photoBase64,
      currentMax,
    });

    const proposed = this.clampPercent(ai.percent);
    let progressPercent: number;
    if (ai.hasProgression === true) {
      progressPercent = proposed > currentMax ? proposed : currentMax;
    } else if (proposed > currentMax) {
      // Souvent le modèle oublie hasProgression: true alors que percent est cohérent
      progressPercent = proposed;
    } else {
      progressPercent = currentMax;
    }

    progressPercent = this.adjustProgressFromAiDescription(
      progressPercent,
      currentMax,
      proposed,
      ai,
    );

    const uploadedAt = input?.uploadedAt
      ? new Date(input.uploadedAt as any)
      : new Date();
    if (Number.isNaN(uploadedAt.getTime())) {
      throw new BadRequestException('uploadedAt invalide');
    }

    const noteTerrain =
      typeof input.comment === 'string' ? input.comment.trim() : '';
    const descriptionProgression = noteTerrain
      ? `${ai.reason}\n\n— Note terrain : ${noteTerrain}`
      : ai.reason;

    const created = await this.suiviModel.create({
      projectId: new Types.ObjectId(projectId),
      workerId: new Types.ObjectId(workerId),
      // compat ancien champ
      photo_url: photoUrl,
      // nouveau champ
      photoUrl,
      uploadedAt,
      progressPercent,
      progressIndex,
      aiAnalysis: ai.raw,
      // compat avec ancien module: garder aussi une valeur de pourcentage
      pourcentage_avancement: progressPercent,
      date_suivi: uploadedAt,
      description_progression: descriptionProgression,
      cout_actuel: 0,
    });

    // Mettre à jour l'avancement global du projet (logique existante)
    await this.projectService.updateStatusAndProgress(
      projectId,
      progressPercent,
    );

    if (ai.hasDelay && ai.delayReason) {
      try {
        const delayMessage = `⚠️ Alerte chantier — Projet "${String(projectLean?.titre ?? '')}": ${ai.delayReason}. Avancement actuel : ${progressPercent}%.`;

        const clientId = this.clientIdFromProject(projectLean);
        if (clientId && Types.ObjectId.isValid(clientId)) {
          await this.notificationsService.create({
            userId: clientId,
            type: 'RETARD_CHANTIER',
            message: delayMessage,
            projectId,
            read: false,
          });
        }

        const admins = await this.projectService.getAdminIds();
        for (const adminId of admins) {
          await this.notificationsService.create({
            userId: adminId,
            type: 'RETARD_CHANTIER',
            message: delayMessage,
            projectId,
            read: false,
          });
        }
      } catch (err) {
        console.error('Notification retard chantier échouée :', err);
      }
    }

    const advancement = progressPercent > currentMax;
    try {
      const apps = (projectLean?.applications ?? []) as Array<{
        artisanId?: Types.ObjectId | string;
        statut?: string;
      }>;
      const acceptedArtisanIds = apps
        .filter((a) => a?.statut === 'acceptee' && a?.artisanId)
        .map((a) => String(a.artisanId));

      await this.notificationsService.notifyPhotoSuiviAnalyzed({
        projectId,
        projectTitle: String(projectLean?.titre ?? ''),
        clientId: this.clientIdFromProject(projectLean),
        workerId,
        advancement,
        oldPercent: currentMax,
        newPercent: progressPercent,
        acceptedArtisanIds,
      });
    } catch (err) {
      console.error('notifyPhotoSuiviAnalyzed:', err);
    }

    try {
      await this.alertsService.evaluateDelayAfterPhotoUpload(
        projectId,
        workerId,
        progressPercent,
      );
    } catch (err) {
      console.error('evaluateDelayAfterPhotoUpload:', err);
    }

    return {
      suivi: created.toObject(),
      ai: {
        percent: progressPercent,
        reason: ai.reason,
        hasProgression: progressPercent > currentMax,
        hasDelay: ai.hasDelay,
        delayReason: ai.delayReason,
      },
      currentMaxBefore: currentMax,
    };
  }

  /**
   * Retourne le max `progressPercent` existant pour ce projet.
   * Si absent (anciens documents), utilise `pourcentage_avancement`.
   *
   * @param projectId ID du projet
   * @returns max actuel (0-100)
   */
  private async getCurrentMaxProgressPercent(
    projectId: string,
  ): Promise<number> {
    const pid = new Types.ObjectId(projectId);
    const row = await this.suiviModel
      .findOne({ projectId: pid })
      .sort({ progressPercent: -1, pourcentage_avancement: -1, createdAt: -1 })
      .select('progressPercent pourcentage_avancement')
      .lean()
      .exec();

    const val =
      typeof (row as any)?.progressPercent === 'number'
        ? (row as any).progressPercent
        : typeof (row as any)?.pourcentage_avancement === 'number'
          ? (row as any).pourcentage_avancement
          : 0;

    return this.clampPercent(val);
  }

  /** Clé API nettoyée (trim, guillemets, BOM). */
  private getAnthropicApiKey(): string | null {
    const raw = process.env.ANTHROPIC_API_KEY;
    if (raw == null || typeof raw !== 'string') return null;
    let k = raw.replace(/^\uFEFF/, '').trim();
    if (
      (k.startsWith('"') && k.endsWith('"')) ||
      (k.startsWith("'") && k.endsWith("'"))
    ) {
      k = k.slice(1, -1).trim();
    }
    return k.length >= 10 ? k : null;
  }

  /** Modèle Messages API (surchargeable si le compte n’a pas accès à Sonnet 4). */
  private getAnthropicModel(): string {
    const m = process.env.ANTHROPIC_MODEL?.trim();
    return m && m.length > 3 ? m : 'claude-sonnet-4-20250514';
  }

  /**
   * Pas d’incrément hors ligne en production sauf si SUIVI_OFFLINE_PROGRESS_PER_PHOTO est défini.
   * En développement : +5 % par défaut seulement si clé absente / HTTP 401 / 403 (désactiver avec SUIVI_OFFLINE_ON_AUTH_ERROR=false).
   * SUIVI_OFFLINE_PROGRESS_PER_PHOTO=N force N pour toutes les erreurs éligibles (1–25).
   */
  private resolveOfflineStep(args: {
    httpStatus?: number;
    trigger: 'no_key' | 'unauthorized' | 'other_http' | 'parse_error';
  }): number {
    const raw = process.env.SUIVI_OFFLINE_PROGRESS_PER_PHOTO;
    if (raw !== undefined && String(raw).trim() !== '') {
      const n = Number.parseInt(String(raw).trim(), 10);
      if (!Number.isFinite(n) || n < 0) return 0;
      return Math.min(25, n);
    }

    const authLike =
      args.trigger === 'no_key' ||
      args.trigger === 'unauthorized' ||
      args.httpStatus === 401 ||
      args.httpStatus === 403;

    if (process.env.NODE_ENV === 'production') {
      return 0;
    }

    const disabled =
      process.env.SUIVI_OFFLINE_ON_AUTH_ERROR === '0' ||
      process.env.SUIVI_OFFLINE_ON_AUTH_ERROR === 'false';

    if (disabled) return 0;

    if (authLike) return 5;

    return 0;
  }

  /** Incrément non décroissant quand Claude n’est pas utilisable. */
  private tryOfflineProgress(args: {
    currentMax: number;
    httpStatus?: number;
    detail?: string;
    trigger: 'no_key' | 'unauthorized' | 'other_http' | 'parse_error';
  }): ClaudeResult | null {
    const step = this.resolveOfflineStep({
      httpStatus: args.httpStatus,
      trigger: args.trigger,
    });
    if (step <= 0) return null;
    const next = Math.min(100, args.currentMax + step);
    if (next <= args.currentMax) return null;
    const why =
      args.trigger === 'no_key'
        ? 'clé API absente ou trop courte'
        : args.httpStatus === 401 || args.httpStatus === 403
          ? `clé API refusée (HTTP ${args.httpStatus})`
          : args.httpStatus != null
            ? `erreur API (HTTP ${args.httpStatus})`
            : args.trigger === 'parse_error'
              ? 'réponse IA illisible'
              : 'analyse indisponible';
    console.warn(
      `[SuiviService] Mode hors ligne (+${step} %) — ${why}. Détail: ${args.detail ?? 'n/a'}`,
    );
    return {
      percent: next,
      reason: `Mode démo (sans IA joignable) : +${step} %. ${why}. Gratuit : installez Ollama (ollama.com), \`ollama pull llava\`, laissez SUIVI_AI_PROVIDER=auto. Payant : ANTHROPIC_API_KEY. Désactiver ce démo : SUIVI_OFFLINE_ON_AUTH_ERROR=false.`,
      raw: JSON.stringify({
        offline: true,
        step,
        httpStatus: args.httpStatus,
        trigger: args.trigger,
      }),
      hasProgression: true,
      hasDelay: false,
      delayReason: null,
    };
  }

  private getSuiviAiProvider(): 'auto' | 'ollama' | 'anthropic' {
    const p = process.env.SUIVI_AI_PROVIDER?.trim().toLowerCase();
    if (p === 'ollama') return 'ollama';
    if (p === 'anthropic') return 'anthropic';
    return 'auto';
  }

  private getOllamaBaseUrl(): string {
    const u =
      process.env.OLLAMA_HOST?.trim() || process.env.OLLAMA_BASE_URL?.trim();
    return (u || 'http://127.0.0.1:11434').replace(/\/$/, '');
  }

  private getOllamaModel(): string {
    return process.env.OLLAMA_MODEL?.trim() || 'llava';
  }

  private buildAnalysisPrompt(currentMax: number): string {
    return `Tu es un expert en analyse de chantiers de construction.

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Contexte : avant cette photo, l'avancement GLOBAL du projet était ${currentMax}%.

Échelle d'estimation du pourcentage GLOBAL (maison / bâtiment neuf), à adapter à la photo :
- Terrain nu, herbe, aucun matériel ni fouille : 3 à 8 %
- Terrassement, fouilles, tranchées : 8 à 18 %
- Ferraillage, fondations, coulage béton, dalle, camion toupie, ouvriers sur béton frais : 18 à 40 %
- Murs / élévation / gros œuvre visible : 35 à 55 %
- Toiture / charpente : 50 à 70 %
- Second œuvre, finitions : 65 à 95 %

RÈGLES IMPORTANTES :
- "percent" = ta meilleure estimation GLOBALE 0-100 du chantier, PAS seulement "par rapport à avant".
- Si tu vois du béton coulé, des fondations, des ouvriers, du ferraillage, une pompe à béton ou un mixer : mets AU MINIMUM 15 % (sauf si currentMax est déjà plus haut).
- Ne mets PAS 0 % si la photo montre un vrai chantier avec travaux ou structures ; utilise au moins 5-12 %.
- "hasProgression": true si percent > ${currentMax}, sinon false.
- "hasDelay": true UNIQUEMENT si tu vois clairement un arrêt anormal, chantier abandonné, ou danger — pas pour un simple terrain en préparation.

Réponds avec ce JSON exact :
{
  "percent": <entier 0-100>,
  "hasProgression": <true ou false>,
  "hasDelay": <true ou false>,
  "delayReason": <string ou null>,
  "reason": <string courte en français>
}`;
  }

  /**
   * LLaVA / petits VLM renvoient souvent percent: 0 alors que la description parle de fondations, béton, etc.
   * On relève le pourcentage minimal à partir du texte renvoyé (hors mode offline).
   */
  private adjustProgressFromAiDescription(
    applied: number,
    currentMax: number,
    proposedFromModel: number,
    ai: ClaudeResult,
  ): number {
    try {
      if (String(ai.raw || '').includes('"offline":true')) return applied;
    } catch {
      /* ignore */
    }

    const blob = `${ai.reason}\n${String(ai.raw || '').slice(0, 1200)}`.toLowerCase();
    const hasAny = (words: string[]) => words.some((w) => blob.includes(w));

    const tiers: { words: string[]; minPct: number }[] = [
      {
        words: [
          'finition',
          'peinture',
          'carrelage',
          'menuiser',
          'sanitaire pos',
          'finishing',
          'painting',
          'tiling',
        ],
        minPct: 72,
      },
      {
        words: [
          'toiture',
          'charpente',
          'couverture',
          'tuile',
          'roof',
          'truss',
          'roofing',
        ],
        minPct: 52,
      },
      {
        words: [
          'dalle',
          'semelle',
          'fondation',
          'fondations',
          'béton',
          'beton',
          'coulage',
          'coulé',
          'coulee',
          'ferraill',
          'rebar',
          'armature',
          'coffrage',
          'hourdis',
          'foundation',
          'concrete pour',
          'pouring concrete',
          'wet concrete',
          'footing',
          'slab',
        ],
        minPct: 22,
      },
      {
        words: [
          'toupi',
          'mixer',
          'bétonnière',
          'betonniere',
          'pompe à béton',
          'pompe a beton',
          'concrete mixer',
          'cement truck',
        ],
        minPct: 24,
      },
      {
        words: [
          'ouvrier',
          'chantier',
          'casque',
          'gilet',
          'échafaudage',
          'echafaudage',
          'pelleteuse',
          'pellet',
          'grue',
          'engin',
          'worker',
          'hard hat',
          'construction site',
          'excavator',
          'crane',
          'scaffold',
        ],
        minPct: 14,
      },
      {
        words: [
          'tranchée',
          'tranchee',
          'fouille',
          'excavation',
          'terrassement',
          'trench',
          'earthwork',
        ],
        minPct: 11,
      },
    ];

    for (const { words, minPct } of tiers) {
      if (hasAny(words)) {
        return Math.min(
          100,
          Math.max(applied, currentMax, proposedFromModel, minPct),
        );
      }
    }

    if (
      applied === currentMax &&
      proposedFromModel <= currentMax &&
      hasAny([
        'préparation',
        'preparation',
        'terrain',
        'parcelle',
        'herbe',
        'nature',
        'vide',
        'plot',
        'vacant',
      ])
    ) {
      return Math.min(100, Math.max(applied, 5));
    }

    return applied;
  }

  private parseJsonToClaudeResult(modelText: string): ClaudeResult | null {
    const cleaned = this.stripMarkdownFences(String(modelText));
    try {
      const parsed = JSON.parse(cleaned);
      const percent = this.clampPercent(parsed?.percent);
      const hasProgression = parsed?.hasProgression === true;
      const hasDelay = parsed?.hasDelay === true;
      const delayReason =
        typeof parsed?.delayReason === 'string' ? parsed.delayReason : null;
      const reason =
        typeof parsed?.reason === 'string' ? parsed.reason : 'Analyse IA';
      return {
        percent,
        reason,
        raw: String(modelText),
        hasProgression,
        hasDelay,
        delayReason,
      };
    } catch {
      return null;
    }
  }

  /** Ollama (gratuit, local) — https://ollama.com */
  private async analyzeWithOllama(args: {
    photoBase64: string;
    currentMax: number;
  }): Promise<ClaudeResult | null> {
    const base = this.getOllamaBaseUrl();
    const model = this.getOllamaModel();
    const prompt = this.buildAnalysisPrompt(args.currentMax);
    try {
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
              images: [args.photoBase64],
            },
          ],
          stream: false,
          options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.warn(`[SuiviService] Ollama HTTP ${res.status}: ${t.slice(0, 120)}`);
        return null;
      }
      const data: any = await res.json();
      const text = String(data?.message?.content ?? '');
      const parsed = this.parseJsonToClaudeResult(text);
      if (parsed) {
        return {
          ...parsed,
          reason: `${parsed.reason} (Ollama / ${model})`,
        };
      }
      console.warn('[SuiviService] Ollama : JSON de réponse non exploitable');
      return null;
    } catch (e) {
      console.warn('[SuiviService] Ollama injoignable —', e);
      return null;
    }
  }

  /** Appel Anthropic uniquement (sans Ollama). */
  private async runAnthropicVision(
    b64: string,
    currentMax: number,
    apiKey: string,
  ): Promise<
    | { type: 'ok'; result: ClaudeResult }
    | { type: 'http'; status: number; text: string }
    | { type: 'parse'; raw: string }
  > {
    const prompt = this.buildAnalysisPrompt(currentMax);
    const body = {
      model: this.getAnthropicModel(),
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: b64,
              },
            },
          ],
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
      return {
        type: 'http',
        status: res.status,
        text: text || res.statusText,
      };
    }

    const data: any = await res.json();
    const anthropicText =
      data?.content?.find?.((c: any) => c?.type === 'text')?.text ??
      data?.content?.[0]?.text ??
      '';

    const fromAnthropic = this.parseJsonToClaudeResult(String(anthropicText));
    if (fromAnthropic) return { type: 'ok', result: fromAnthropic };
    return { type: 'parse', raw: String(anthropicText) };
  }

  /**
   * Anthropic (cloud) et/ou Ollama (local, gratuit).
   * auto : **Ollama en premier** (même si ANTHROPIC_API_KEY est présente mais invalide), puis Claude si besoin.
   */
  private async analyzePhotoWithAiOrFallback(args: {
    photoBase64?: string;
    currentMax: number;
  }): Promise<ClaudeResult> {
    const baseFallback = (): ClaudeResult => {
      const percent = this.clampPercent(args.currentMax);
      return {
        percent,
        reason: 'Analyse non disponible — pourcentage conservé',
        raw: JSON.stringify({
          percent,
          reason: 'fallback_conserved',
          hasProgression: false,
        }),
        hasProgression: false,
        hasDelay: false,
        delayReason: null,
      };
    };

    if (!args.photoBase64) {
      return {
        ...baseFallback(),
        reason: 'Image absente — pourcentage conservé (envoyez photoBase64 pour l’analyse IA)',
        raw: JSON.stringify({
          percent: this.clampPercent(args.currentMax),
          reason: 'no_photoBase64',
          hasProgression: false,
        }),
      };
    }

    const provider = this.getSuiviAiProvider();
    const apiKey = this.getAnthropicApiKey();
    const b64 = args.photoBase64;

    const ollamaHint =
      'Installez https://ollama.com, lancez Ollama, puis dans un terminal : ollama pull llava — variable SUIVI_AI_PROVIDER=auto (défaut). Désactiver le +5 % démo : SUIVI_OFFLINE_ON_AUTH_ERROR=false.';

    if (provider === 'ollama') {
      const o = await this.analyzeWithOllama({
        photoBase64: b64,
        currentMax: args.currentMax,
      });
      if (o) return o;
      const off = this.tryOfflineProgress({
        currentMax: args.currentMax,
        detail: ollamaHint,
        trigger: 'no_key',
      });
      if (off) return off;
      return baseFallback();
    }

    if (provider === 'anthropic') {
      if (!apiKey) {
        const off = this.tryOfflineProgress({
          currentMax: args.currentMax,
          detail: 'ANTHROPIC_API_KEY requise pour SUIVI_AI_PROVIDER=anthropic',
          trigger: 'no_key',
        });
        if (off) return off;
        return baseFallback();
      }
      const ar = await this.runAnthropicVision(b64, args.currentMax, apiKey);
      if (ar.type === 'ok') return ar.result;
      if (ar.type === 'http') {
        const isAuth = ar.status === 401 || ar.status === 403;
        const off = this.tryOfflineProgress({
          currentMax: args.currentMax,
          httpStatus: ar.status,
          detail: ar.text?.slice(0, 200),
          trigger: isAuth ? 'unauthorized' : 'other_http',
        });
        if (off) return off;
        const hint = isAuth
          ? ' Vérifiez ANTHROPIC_API_KEY ou passez en SUIVI_AI_PROVIDER=auto avec Ollama.'
          : '';
        return {
          percent: this.clampPercent(args.currentMax),
          reason: `Analyse indisponible (HTTP ${ar.status}) — pourcentage conservé.${hint}`,
          raw: ar.text,
          hasProgression: false,
          hasDelay: false,
          delayReason: null,
        };
      }
      const off = this.tryOfflineProgress({
        currentMax: args.currentMax,
        httpStatus: undefined,
        detail: 'JSON IA invalide (Claude)',
        trigger: 'parse_error',
      });
      if (off) return off;
      return {
        percent: this.clampPercent(args.currentMax),
        reason: 'Analyse non disponible — pourcentage conservé',
        raw: ar.raw,
        hasProgression: false,
        hasDelay: false,
        delayReason: null,
      };
    }

    // --- provider === 'auto' : Ollama d’abord (gratuit), puis Anthropic si clé ---
    const oFirst = await this.analyzeWithOllama({
      photoBase64: b64,
      currentMax: args.currentMax,
    });
    if (oFirst) return oFirst;

    if (apiKey) {
      const ar = await this.runAnthropicVision(b64, args.currentMax, apiKey);
      if (ar.type === 'ok') return ar.result;
      if (ar.type === 'http') {
        const isAuth = ar.status === 401 || ar.status === 403;
        const off = this.tryOfflineProgress({
          currentMax: args.currentMax,
          httpStatus: ar.status,
          detail: ar.text?.slice(0, 200),
          trigger: isAuth ? 'unauthorized' : 'other_http',
        });
        if (off) return off;
        return {
          percent: this.clampPercent(args.currentMax),
          reason: `Claude indisponible (HTTP ${ar.status}). Ollama aussi : ${ollamaHint}`,
          raw: ar.text,
          hasProgression: false,
          hasDelay: false,
          delayReason: null,
        };
      }
      const off = this.tryOfflineProgress({
        currentMax: args.currentMax,
        httpStatus: undefined,
        detail: 'JSON Claude invalide',
        trigger: 'parse_error',
      });
      if (off) return off;
      return {
        percent: this.clampPercent(args.currentMax),
        reason: 'Analyse non disponible — pourcentage conservé',
        raw: ar.raw,
        hasProgression: false,
        hasDelay: false,
        delayReason: null,
      };
    }

    const off = this.tryOfflineProgress({
      currentMax: args.currentMax,
      detail: `Pas de ANTHROPIC_API_KEY. ${ollamaHint}`,
      trigger: 'no_key',
    });
    if (off) return off;
    return baseFallback();
  }

  /**
   * Supprime des fences markdown éventuelles autour d'un JSON.
   *
   * @param text Texte brut
   * @returns Texte nettoyé
   */
  private stripMarkdownFences(text: string): string {
    const s = String(text ?? '').trim();
    return s
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  /**
   * Clamp un pourcentage dans [0, 100].
   *
   * @param n Valeur entrée
   * @returns Valeur bornée
   */
  private clampPercent(n: unknown): number {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
  }
}
