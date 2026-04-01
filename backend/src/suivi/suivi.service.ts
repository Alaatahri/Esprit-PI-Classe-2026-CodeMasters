import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationsService } from '../alerts/notifications.service';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import { ProjectService } from '../project/project.service';
import { Suivi, SuiviDocument } from './schemas/suivi.schema';

type ClaudeResult = { percent: number; reason: string; raw: string };

@Injectable()
export class SuiviService {
  constructor(
    @InjectModel(Suivi.name) private readonly suiviModel: Model<SuiviDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly projectService: ProjectService,
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    uploadedAt?: string | Date;
  }) {
    const projectId = String(input?.projectId || '').trim();
    const workerId = String(input?.workerId || '').trim();
    const photoUrl = String(input?.photoUrl || '').trim();
    const photoBase64 = typeof input?.photoBase64 === 'string' ? input.photoBase64.trim() : undefined;

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

    // Règles de progress: récupérer max actuel sur ce projet (compat avec anciens champs)
    const currentMax = await this.getCurrentMaxProgressPercent(projectId);

    // Index: total entrées existantes + 1
    const progressIndex =
      (await this.suiviModel.countDocuments({ projectId: new Types.ObjectId(projectId) }).exec()) + 1;

    const ai = await this.analyzePhotoWithClaudeOrFallback({
      photoBase64,
      currentMax,
    });

    const proposed = this.clampPercent(ai.percent);
    const progressPercent = proposed <= currentMax ? currentMax : proposed;

    const uploadedAt = input?.uploadedAt ? new Date(input.uploadedAt as any) : new Date();
    if (Number.isNaN(uploadedAt.getTime())) {
      throw new BadRequestException('uploadedAt invalide');
    }

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
      description_progression: ai.reason,
      cout_actuel: 0,
    });

    // Mettre à jour l'avancement global du projet (logique existante)
    await this.projectService.updateStatusAndProgress(projectId, progressPercent);

    const advancement = proposed > currentMax;
    try {
      const apps = ((project as any)?.applications ?? []) as Array<{
        artisanId?: Types.ObjectId | string;
        statut?: string;
      }>;
      const acceptedArtisanIds = apps
        .filter((a) => a?.statut === 'acceptee' && a?.artisanId)
        .map((a) => String(a.artisanId));

      await this.notificationsService.notifyPhotoSuiviAnalyzed({
        projectId,
        projectTitle: String((project as any)?.titre ?? ''),
        clientId: String((project as any)?.clientId ?? ''),
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
      ai: { percent: proposed, reason: ai.reason },
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
  private async getCurrentMaxProgressPercent(projectId: string): Promise<number> {
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

  /**
   * Analyse une photo via Claude (Anthropic) si `ANTHROPIC_API_KEY` existe.
   * Sinon fallback: currentMax + 5 (cap 100).
   *
   * @param args photoBase64 et currentMax
   * @returns percent/reason + raw
   */
  private async analyzePhotoWithClaudeOrFallback(args: {
    photoBase64?: string;
    currentMax: number;
  }): Promise<ClaudeResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const percent = Math.min(this.clampPercent(args.currentMax + 5), 100);
      return {
        percent,
        reason: 'manual fallback',
        raw: JSON.stringify({ percent, reason: 'manual fallback' }),
      };
    }

    if (!args.photoBase64) {
      const percent = Math.min(this.clampPercent(args.currentMax + 5), 100);
      return {
        percent,
        reason: 'manual fallback (no photoBase64 provided)',
        raw: JSON.stringify({ percent, reason: 'manual fallback (no photoBase64 provided)' }),
      };
    }

    const prompt =
      'Analyze this construction site photo. Estimate the overall completion percentage (0-100). ' +
      'Return only a JSON: { "percent": number, "reason": string }';

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
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
                data: args.photoBase64,
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
      const percent = Math.min(this.clampPercent(args.currentMax + 5), 100);
      return {
        percent,
        reason: `manual fallback (Anthropic ${res.status})`,
        raw: text || res.statusText,
      };
    }

    const data: any = await res.json();
    const text =
      data?.content?.find?.((c: any) => c?.type === 'text')?.text ??
      data?.content?.[0]?.text ??
      '';

    const cleaned = this.stripMarkdownFences(String(text));
    try {
      const parsed = JSON.parse(cleaned);
      const percent = this.clampPercent(parsed?.percent);
      const reason = typeof parsed?.reason === 'string' ? parsed.reason : 'AI analysis';
      return { percent, reason, raw: String(text) };
    } catch (e: any) {
      const percent = Math.min(this.clampPercent(args.currentMax + 5), 100);
      return {
        percent,
        reason: 'manual fallback (invalid AI JSON)',
        raw: String(text),
      };
    }
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

