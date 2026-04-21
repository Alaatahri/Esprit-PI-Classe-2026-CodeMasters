import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MatchingRequest,
  MatchingRequestDocument,
} from './schemas/matching-request.schema';
import { ProjectService } from '../project/project.service';
import { UserService } from '../user/user.service';

function oid(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Identifiant invalide.');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectModel(MatchingRequest.name)
    private readonly matchingModel: Model<MatchingRequestDocument>,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  async listForExpert(expertId: string) {
    const list = await this.matchingModel
      .find({ expertId: oid(expertId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const now = new Date();
    return list.map((r: any) => ({
      _id: String(r._id),
      status: r.status,
      isExpired:
        r.status === 'pending' &&
        r.expiresAt &&
        new Date(r.expiresAt) <= now,
      expiresAt: r.expiresAt ? new Date(r.expiresAt).toISOString() : undefined,
      matchScore: typeof r.matchScore === 'number' ? r.matchScore : undefined,
      projectId: { _id: String(r.projectId) },
    }));
  }

  async getDetailForExpert(requestId: string, expertId: string) {
    const req = await this.matchingModel
      .findOne({ _id: oid(requestId), expertId: oid(expertId) })
      .lean()
      .exec();
    if (!req) {
      throw new NotFoundException('Demande introuvable.');
    }
    const project = await this.projectService.findOne(String(req.projectId));
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const now = new Date();
    const exp = req.expiresAt ? new Date(req.expiresAt) : undefined;
    return {
      request: {
        _id: String(req._id),
        status: req.status,
        matchScore: req.matchScore,
        requiredCompetences: [] as string[],
        sentAt: req.sentAt
          ? new Date(req.sentAt).toISOString()
          : undefined,
        expiresAt: exp?.toISOString(),
        respondedAt: req.respondedAt
          ? new Date(req.respondedAt).toISOString()
          : undefined,
        isExpired:
          req.status === 'pending' && exp != null && exp <= now,
      },
      project: project as unknown as Record<string, unknown>,
    };
  }

  async respond(
    requestId: string,
    expertId: string,
    response: 'accepted' | 'refused',
  ) {
    const req = await this.matchingModel.findOne({
      _id: oid(requestId),
      expertId: oid(expertId),
    });
    if (!req) {
      throw new NotFoundException('Demande introuvable.');
    }
    if (req.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée.');
    }
    if (response === 'accepted') {
      if (req.expiresAt && new Date(req.expiresAt) <= new Date()) {
        throw new BadRequestException('Invitation expirée.');
      }
    }

    req.status = response;
    req.respondedAt = new Date();
    await req.save();

    if (response === 'accepted') {
      await this.projectService.assignExpert(
        String(req.projectId),
        String(req.expertId),
      );
    }

    return { ok: true, status: req.status };
  }

  async adminListPending(filter?: { projectId?: string }) {
    const q: Record<string, unknown> = { status: 'pending' };
    const pid = filter?.projectId?.trim();
    if (pid) {
      q.projectId = oid(pid);
    }
    return this.matchingModel
      .find(q)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate({ path: 'expertId', select: 'nom email role telephone' })
      .populate({ path: 'projectId', select: 'titre statut budget_estime clientId expertId createdAt' })
      .lean()
      .exec();
  }

  async adminProjectOverview(projectId: string) {
    const project = await this.projectService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const stats = await this.statsForProject(projectId);
    const requests = await this.matchingModel
      .find({ projectId: oid(projectId) })
      .sort({ createdAt: -1 })
      .limit(300)
      .populate({ path: 'expertId', select: 'nom email role telephone' })
      .lean()
      .exec();
    return { project, stats, requests };
  }

  async adminInviteExpert(
    projectId: string,
    body: { expertId?: string; matchScore?: number; expiresInDays?: number },
  ) {
    const expertId = body?.expertId?.trim();
    if (!expertId) {
      throw new BadRequestException('expertId requis.');
    }
    const project = await this.projectService.findOne(projectId);
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }
    const p: any = project as any;
    if (p.expertId) {
      throw new BadRequestException("Un expert est déjà assigné à ce projet.");
    }

    const pid = oid(projectId);
    const eid = oid(expertId);

    const exists = await this.matchingModel
      .findOne({ projectId: pid, expertId: eid })
      .lean()
      .exec();
    if (exists) {
      return { ok: true, requestId: String((exists as any)._id), alreadyExisted: true };
    }

    const expiresInDays =
      typeof body?.expiresInDays === 'number' && body.expiresInDays > 0
        ? Math.min(60, Math.max(1, Math.round(body.expiresInDays)))
        : 14;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const matchScore =
      typeof body?.matchScore === 'number'
        ? Math.min(100, Math.max(0, Math.round(body.matchScore)))
        : 72;

    const created = await this.matchingModel.create({
      expertId: eid,
      projectId: pid,
      status: 'pending',
      matchScore,
      sentAt: new Date(),
      expiresAt,
    });

    return { ok: true, requestId: String(created._id), alreadyExisted: false };
  }

  private parseAiRecommendations(payload: any): Array<{ expertId: string; score?: number }> {
    const list =
      (payload && Array.isArray(payload.recommendations) && payload.recommendations) ||
      (payload && Array.isArray(payload.matches) && payload.matches) ||
      (payload && Array.isArray(payload) && payload) ||
      [];

    const out: Array<{ expertId: string; score?: number }> = [];
    for (const it of list) {
      if (!it) continue;
      const expertId = String((it.expertId ?? it.userId ?? it.id ?? it._id ?? '')).trim();
      if (!expertId) continue;
      const scoreRaw = it.score ?? it.matchScore ?? it.similarity ?? it.confidence;
      const score =
        typeof scoreRaw === 'number'
          ? scoreRaw
          : typeof scoreRaw === 'string' && scoreRaw.trim() !== ''
            ? Number(scoreRaw)
            : undefined;
      out.push({ expertId, score: typeof score === 'number' && Number.isFinite(score) ? score : undefined });
    }
    return out;
  }

  async adminAutoMatch(
    projectId: string,
    body: {
      limit?: number;
      expiresInDays?: number;
      minScore?: number;
      aiUrl?: string;
      aiKey?: string;
    },
  ) {
    const project = await this.projectService.findOne(projectId);
    if (!project) throw new NotFoundException('Projet introuvable.');
    const p: any = project as any;
    if (p.expertId) {
      throw new BadRequestException("Un expert est déjà assigné à ce projet.");
    }

    // Workflow: inviter 1 expert à la fois, et attendre expiration (24h par défaut).
    const limit =
      typeof body?.limit === 'number'
        ? Math.min(80, Math.max(5, Math.round(body.limit)))
        : 25;
    const expiresInDays =
      typeof body?.expiresInDays === 'number'
        ? Math.min(14, Math.max(1, Math.round(body.expiresInDays)))
        : 1;
    const minScore =
      typeof body?.minScore === 'number' && Number.isFinite(body.minScore) ? body.minScore : undefined;

    // 1) Si une invitation pending non expirée existe → on ne fait rien (on attend la réponse).
    const now = new Date();
    const pendingActive = await this.matchingModel
      .findOne({
        projectId: oid(projectId),
        status: 'pending',
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
      })
      .lean()
      .exec();
    if (pendingActive) {
      return { ok: true, projectId, action: 'waiting', pendingRequestId: String((pendingActive as any)._id) };
    }

    // 2) Si il y a des pending expirées, on les marque refusées (libère le projet pour l'invite suivante).
    const expiredPending = await this.matchingModel.find({
      projectId: oid(projectId),
      status: 'pending',
      expiresAt: { $lte: now },
    });
    for (const r of expiredPending) {
      r.status = 'refused';
      r.respondedAt = new Date();
      await r.save();
    }

    // 3) Déterminer les experts déjà invités (éviter de ré-inviter).
    const prev = await this.matchingModel
      .find({ projectId: oid(projectId) })
      .select('expertId status')
      .lean()
      .exec();
    const excluded = new Set<string>(prev.map((r: any) => String(r.expertId)));

    const aiUrl = (body?.aiUrl || process.env.MATCHING_AI_URL || '').trim();
    if (!aiUrl) {
      throw new BadRequestException(
        'MATCHING_AI_URL non configurée côté backend (ou fournissez aiUrl dans le body).',
      );
    }
    const aiKey = (body?.aiKey || process.env.MATCHING_AI_KEY || '').trim();

    const experts = (await this.userService.findAll(500))
      .filter((u: any) => String(u?.role) === 'expert')
      .map((u: any) => ({
        _id: u._id?.toString?.() ?? String(u._id),
        nom: u.nom,
        email: u.email,
        telephone: u.telephone,
        competences: u.competences ?? [],
        rating: u.rating,
        experience_annees: u.experience_annees,
        isAvailable: u.isAvailable,
        zones_travail: u.zones_travail ?? [],
        specialite: u.specialite,
      }));

    // Appel AI
    const res = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(aiKey ? { Authorization: `Bearer ${aiKey}` } : {}),
      },
      body: JSON.stringify({
        project,
        experts,
        limit,
        minScore,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BadRequestException(
        `AI matching error (${res.status}): ${text || res.statusText}`,
      );
    }

    const aiPayload = await res.json().catch(() => ({}));
    let recs = this.parseAiRecommendations(aiPayload);

    if (minScore != null) {
      recs = recs.filter((r) => (typeof r.score === 'number' ? r.score >= minScore : true));
    }
    recs = recs
      .filter((r) => !excluded.has(r.expertId))
      .slice(0, limit);

    if (recs.length === 0) {
      return { ok: true, projectId, action: 'no-candidates', ai: { url: aiUrl } };
    }

    // 4) Inviter UNIQUEMENT le meilleur candidat (top1) — les autres viendront après expiration.
    const top = recs[0];
    const result = await this.adminInviteExpert(projectId, {
      expertId: top.expertId,
      matchScore: typeof top.score === 'number' ? top.score : undefined,
      expiresInDays,
    });

    return {
      ok: true,
      projectId,
      action: 'invited',
      invited: {
        expertId: top.expertId,
        requestId: result.requestId,
        alreadyExisted: result.alreadyExisted,
        score: top.score,
        expiresInDays,
      },
      ai: { url: aiUrl, hasKey: Boolean(aiKey) },
    };
  }

  /** Agrégats par projet pour le catalogue expert. */
  async statsForProject(projectId: string) {
    const pid = oid(projectId);
    const [pending, refused, accepted] = await Promise.all([
      this.matchingModel.countDocuments({ projectId: pid, status: 'pending' }),
      this.matchingModel.countDocuments({ projectId: pid, status: 'refused' }),
      this.matchingModel.countDocuments({ projectId: pid, status: 'accepted' }),
    ]);
    return {
      inviteCount: pending + refused + accepted,
      pending,
      refused,
      acceptedBy: accepted > 0 ? 'expert' : null,
    };
  }

  proposalDraft(_text: string) {
    const len = Math.min(800, Math.max(40, (_text || '').length * 12));
    return {
      estimatedBudgetTnd: Math.round(len * 120 + 5000),
      estimatedDurationDays: Math.min(180, Math.max(14, Math.round(len / 25))),
      technicalNotes: `<p>Proposition générée (brouillon) à partir du dossier — affinez les détails avant envoi.</p>`,
      materialSuggestions:
        'Matériaux conformes aux normes en vigueur ; précisez marques et gammes avec le client.',
    };
  }

  /**
   * Crée des invitations « pending » pour un expert sur des projets sans expert (seed / démo).
   */
  async ensureInvitesForExpert(
    expertId: string,
    projectIdsWithoutExpert: string[],
  ) {
    const eid = oid(expertId);
    const expires = new Date();
    expires.setDate(expires.getDate() + 14);
    for (const pid of projectIdsWithoutExpert) {
      if (!Types.ObjectId.isValid(pid)) continue;
      const exists = await this.matchingModel.findOne({
        expertId: eid,
        projectId: oid(pid),
      });
      if (exists) continue;
      await this.matchingModel.create({
        expertId: eid,
        projectId: oid(pid),
        status: 'pending',
        matchScore: 72,
        sentAt: new Date(),
        expiresAt: expires,
      });
    }
  }
}
