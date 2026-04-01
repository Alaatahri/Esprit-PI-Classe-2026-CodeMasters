import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../project/schemas/project.schema';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { NotificationsService } from './notifications.service';
import { AlertResponseDto } from './dto/alert-response.dto';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Après un upload photo : calcule retard théorique vs réel et crée une alerte si les conditions sont remplies.
   * Pas de doublon : même `projectId` le même jour calendaire (UTC).
   *
   * @param projectId ID Mongo du projet
   * @param workerId ID utilisateur (ouvrier) ayant envoyé la photo
   * @param realProgress Dernier pourcentage global retenu (0–100)
   * @returns Alerte créée ou null si non déclenchée / doublon
   */
  async evaluateDelayAfterPhotoUpload(
    projectId: string,
    workerId: string,
    realProgress: number,
  ): Promise<AlertDocument | null> {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(workerId)) {
      return null;
    }

    const project: any = await this.projectModel.findById(projectId).lean().exec();
    if (!project) return null;

    const start = project.date_debut ? new Date(project.date_debut) : null;
    const end = project.date_fin_prevue ? new Date(project.date_fin_prevue) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    const today = new Date();
    const totalMs = end.getTime() - start.getTime();
    let totalDays = totalMs / MS_PER_DAY;
    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      totalDays = 1;
    }

    const daysElapsed = (today.getTime() - start.getTime()) / MS_PER_DAY;
    const expectedProgress = Math.min(
      Math.max((daysElapsed / totalDays) * 100, 0),
      100,
    );
    const daysRemaining = (end.getTime() - today.getTime()) / MS_PER_DAY;

    const rp = Math.max(0, Math.min(100, Number(realProgress) || 0));
    const shouldAlert = rp < expectedProgress && daysRemaining <= 3;

    if (!shouldAlert) {
      return null;
    }

    const { startUtc, endUtc } = this.utcDayBounds(today);
    const duplicate = await this.alertModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        alertDate: { $gte: startUtc, $lte: endUtc },
      })
      .lean()
      .exec();

    if (duplicate) {
      return null;
    }

    const alertDate = new Date();
    const doc = await this.alertModel.create({
      projectId: new Types.ObjectId(projectId),
      workerId: new Types.ObjectId(workerId),
      alertDate,
      expectedProgress,
      realProgress: rp,
      daysRemaining,
      status: 'pending',
    });

    await this.notificationsService.notifyDelayAlertCreated({
      alertId: doc._id.toString(),
      projectId,
      projectTitle: String(project.titre ?? ''),
      expectedProgress,
      realProgress: rp,
      daysRemaining,
      clientId: String(project.clientId),
      workerId,
    });

    return doc;
  }

  /**
   * Enregistre la réponse d’un ouvrier sur une alerte (mise à jour uniquement de `workerResponse`).
   *
   * @param alertId ID de l’alerte
   * @param userId ID utilisateur (header x-user-id), doit correspondre à `workerId`
   * @param dto Corps validé
   * @returns Document mis à jour
   */
  async setWorkerResponse(
    alertId: string,
    userId: string,
    dto: AlertResponseDto,
  ): Promise<AlertDocument> {
    if (!Types.ObjectId.isValid(alertId)) {
      throw new BadRequestException('alertId invalide');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (dto.type === 'estimatedDate' && !dto.estimatedDate) {
      throw new BadRequestException('estimatedDate requis pour type=estimatedDate');
    }

    const alert = await this.alertModel.findById(alertId).exec();
    if (!alert) throw new NotFoundException('Alerte introuvable');

    if (alert.workerId?.toString?.() !== userId) {
      throw new ForbiddenException('Seul l’ouvrier concerné peut répondre');
    }

    if (alert.workerResponse) {
      throw new BadRequestException('Réponse déjà enregistrée');
    }

    const respondedAt = new Date();
    const workerResponse: Alert['workerResponse'] = {
      type: dto.type,
      message: dto.message.trim(),
      respondedAt,
    };
    if (dto.type === 'estimatedDate' && dto.estimatedDate) {
      const d = new Date(dto.estimatedDate);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('estimatedDate invalide');
      }
      workerResponse.estimatedDate = d;
    }

    const updated = await this.alertModel
      .findByIdAndUpdate(alertId, { $set: { workerResponse } }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Alerte introuvable');
    return updated;
  }

  /**
   * Alertes retard pertinentes pour la boîte de réception (populate titre projet).
   *
   * @param userId ID utilisateur connecté
   * @param role Rôle Mongo (`admin`, `client`, etc.)
   */
  async listForInbox(userId: string, role: string): Promise<any[]> {
    if (role === 'admin') {
      return this.alertModel
        .find({ status: 'pending' })
        .populate('projectId', 'titre')
        .sort({ alertDate: -1 })
        .limit(40)
        .lean()
        .exec();
    }

    if (role === 'client' && Types.ObjectId.isValid(userId)) {
      const projects = await this.projectModel
        .find({ clientId: new Types.ObjectId(userId) })
        .select('_id')
        .lean()
        .exec();
      const ids = projects.map((p) => p._id);
      if (ids.length === 0) return [];
      return this.alertModel
        .find({ status: 'pending', projectId: { $in: ids } })
        .populate('projectId', 'titre')
        .sort({ alertDate: -1 })
        .limit(40)
        .lean()
        .exec();
    }

    if (role === 'expert' && Types.ObjectId.isValid(userId)) {
      const projects = await this.projectModel
        .find({ expertId: new Types.ObjectId(userId) })
        .select('_id')
        .lean()
        .exec();
      const ids = projects.map((p) => p._id);
      if (ids.length === 0) return [];
      return this.alertModel
        .find({ status: 'pending', projectId: { $in: ids } })
        .populate('projectId', 'titre')
        .sort({ alertDate: -1 })
        .limit(40)
        .lean()
        .exec();
    }

    const filter = Types.ObjectId.isValid(userId)
      ? { status: 'pending' as const, workerId: new Types.ObjectId(userId) }
      : { _id: null };

    return this.alertModel
      .find(filter)
      .populate('projectId', 'titre')
      .sort({ alertDate: -1 })
      .limit(40)
      .lean()
      .exec();
  }

  /**
   * Nombre d’alertes en attente pour le badge « Nouveau ».
   */
  async countPendingForInbox(userId: string, role: string): Promise<number> {
    if (role === 'admin') {
      return this.alertModel.countDocuments({ status: 'pending' }).exec();
    }
    if (role === 'client' && Types.ObjectId.isValid(userId)) {
      const projects = await this.projectModel
        .find({ clientId: new Types.ObjectId(userId) })
        .select('_id')
        .lean()
        .exec();
      const ids = projects.map((p) => p._id);
      if (ids.length === 0) return 0;
      return this.alertModel
        .countDocuments({ status: 'pending', projectId: { $in: ids } })
        .exec();
    }
    if (role === 'expert' && Types.ObjectId.isValid(userId)) {
      const projects = await this.projectModel
        .find({ expertId: new Types.ObjectId(userId) })
        .select('_id')
        .lean()
        .exec();
      const ids = projects.map((p) => p._id);
      if (ids.length === 0) return 0;
      return this.alertModel
        .countDocuments({ status: 'pending', projectId: { $in: ids } })
        .exec();
    }
    if (!Types.ObjectId.isValid(userId)) return 0;
    return this.alertModel
      .countDocuments({
        status: 'pending',
        workerId: new Types.ObjectId(userId),
      })
      .exec();
  }

  /**
   * Bornes du jour UTC [start, end] pour dédoublonnage journalier.
   *
   * @param d Date de référence
   * @returns Début et fin du jour UTC
   */
  private utcDayBounds(d: Date): { startUtc: Date; endUtc: Date } {
    const startUtc = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
    );
    const endUtc = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
    );
    return { startUtc, endUtc };
  }
}
