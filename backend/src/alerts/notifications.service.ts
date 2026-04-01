import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InAppNotificationService } from './in-app-notification.service';

export type DelayAlertNotifyPayload = {
  alertId: string;
  projectId: string;
  projectTitle: string;
  expectedProgress: number;
  realProgress: number;
  daysRemaining: number;
  clientId: string;
  workerId: string;
};

/** Contexte après analyse d’une photo de suivi (avancement chantier). */
export type PhotoSuiviNotifyPayload = {
  projectId: string;
  projectTitle: string;
  clientId: string;
  workerId: string;
  advancement: boolean;
  oldPercent: number;
  newPercent: number;
  acceptedArtisanIds: string[];
};

/**
 * Notifications chantier : persistance Mongo (`notifications`) + journal console.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly userService: UserService,
    private readonly inAppNotificationService: InAppNotificationService,
  ) {}

  private roleByIdMap(): Promise<Map<string, string>> {
    return this.userService.findAll(500).then((users) => {
      const m = new Map<string, string>();
      for (const u of users as any[]) {
        const id = String(u?._id ?? '');
        if (id) m.set(id, String(u?.role ?? ''));
      }
      return m;
    });
  }

  private delayMessage(
    role: string | undefined,
    p: DelayAlertNotifyPayload,
  ): string {
    const exp = p.expectedProgress.toFixed(1);
    const real = p.realProgress.toFixed(1);
    const days = p.daysRemaining.toFixed(1);
    if (role === 'admin') {
      return `🚨 Alerte retard : « ${p.projectTitle} » — ${real}% réel vs ~${exp}% attendu (≈${days} j. restants).`;
    }
    if (role === 'client') {
      return `Votre projet « ${p.projectTitle} » accuse un retard (~${exp}% attendu à ce stade, actuellement ${real}%).`;
    }
    return `Retard signalé sur « ${p.projectTitle} » (${real}% vs ~${exp}%). Merci de traiter l’alerte si vous êtes concerné.`;
  }

  private photoMessage(
    role: string | undefined,
    payload: PhotoSuiviNotifyPayload,
  ): string {
    const t = payload.projectTitle;
    const n = payload.newPercent;
    const o = payload.oldPercent;
    if (payload.advancement) {
      if (role === 'client') {
        return `Votre projet « ${t} » a progressé : ${n}% d’avancement atteint.`;
      }
      if (role === 'admin') {
        return `Avancement sur « ${t} » : ${n}% (était ${o}%).`;
      }
      return `Chantier « ${t} » : ${n}% d’avancement (était ${o}%).`;
    }
    if (role === 'admin') {
      return `⚠️ Aucune hausse d’avancement sur « ${t} » (reste ${n}%).`;
    }
    if (role === 'client') {
      return `Suivi « ${t} » : avancement inchangé (${n}%).`;
    }
    return `« ${t} » : aucune progression détectée (${n}%).`;
  }

  /**
   * Notifie les admins, le client et l’ouvrier qu’une alerte retard a été créée.
   */
  async notifyDelayAlertCreated(
    payload: DelayAlertNotifyPayload,
  ): Promise<{ recipientIds: string[] }> {
    const users = await this.userService.findAll(500);
    const adminIds = users
      .filter((u: any) => u?.role === 'admin')
      .map((u: any) => String(u?._id ?? ''))
      .filter(Boolean);

    const clientId = String(payload.clientId);
    const workerId = String(payload.workerId);
    const recipientIds = Array.from(
      new Set([...adminIds, clientId, workerId]),
    );

    const roles = await this.roleByIdMap();
    const type = 'delay_alert';
    const entries = recipientIds.map((id) => ({
      recipientId: id,
      recipientRole: roles.get(id),
      message: this.delayMessage(roles.get(id), payload),
      type,
      projectId: payload.projectId,
      metadata: {
        alertId: payload.alertId,
        expectedProgress: payload.expectedProgress,
        realProgress: payload.realProgress,
        daysRemaining: payload.daysRemaining,
      },
    }));

    try {
      await this.inAppNotificationService.createMany(entries);
    } catch (e) {
      console.error('notifyDelayAlertCreated persist:', e);
    }

    const msg = `[BMP-NOTIFY] Alerte retard | projet="${payload.projectTitle}" (${payload.projectId})`;
    console.log(`${msg} → ${recipientIds.length} destinataires`);

    return { recipientIds };
  }

  /**
   * Notifie client, admins, auteur photo et artisans acceptés après analyse suivi.
   */
  async notifyPhotoSuiviAnalyzed(
    payload: PhotoSuiviNotifyPayload,
  ): Promise<{ recipientIds: string[] }> {
    const users = await this.userService.findAll(500);
    const adminIds = users
      .filter((u: any) => u?.role === 'admin')
      .map((u: any) => String(u?._id ?? ''))
      .filter(Boolean);

    const clientId = String(payload.clientId);
    const workerId = String(payload.workerId);
    const artisanIds = (payload.acceptedArtisanIds || [])
      .map((id) => String(id))
      .filter(Boolean);

    const recipientIds = Array.from(
      new Set([...adminIds, clientId, workerId, ...artisanIds]),
    );

    const roles = await this.roleByIdMap();
    const type = payload.advancement ? 'progress_update' : 'no_progress';

    const entries = recipientIds.map((id) => ({
      recipientId: id,
      recipientRole: roles.get(id),
      message: this.photoMessage(roles.get(id), payload),
      type,
      projectId: payload.projectId,
      metadata: {
        advancement: payload.advancement,
        oldPercent: payload.oldPercent,
        newPercent: payload.newPercent,
      },
    }));

    try {
      await this.inAppNotificationService.createMany(entries);
    } catch (e) {
      console.error('notifyPhotoSuiviAnalyzed persist:', e);
    }

    console.log(
      `[BMP-NOTIFY] Suivi photo | "${payload.projectTitle}" → ${recipientIds.length} destinataires`,
    );

    return { recipientIds };
  }
}
