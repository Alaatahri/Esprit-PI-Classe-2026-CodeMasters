import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppNotification, AppNotificationDocument } from './schemas/app-notification.schema';

export type CreateInAppNotificationInput = {
  recipientId: string;
  message: string;
  type: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
  recipientRole?: string;
};

/**
 * Persistance des notifications affichables dans le backoffice.
 */
@Injectable()
export class InAppNotificationService {
  constructor(
    @InjectModel(AppNotification.name)
    private readonly model: Model<AppNotificationDocument>,
  ) {}

  /**
   * Crée plusieurs notifications (une ligne par destinataire).
   */
  async createMany(entries: CreateInAppNotificationInput[]): Promise<void> {
    if (!entries.length) return;
    const docs = entries
      .filter((e) => Types.ObjectId.isValid(e.recipientId))
      .map((e) => ({
        recipientId: new Types.ObjectId(e.recipientId),
        recipientRole: e.recipientRole,
        projectId: e.projectId && Types.ObjectId.isValid(e.projectId)
          ? new Types.ObjectId(e.projectId)
          : undefined,
        message: e.message,
        type: e.type,
        read: false,
        metadata: e.metadata,
      }));
    if (docs.length) {
      await this.model.insertMany(docs);
    }
  }

  /**
   * Liste les notifications d’un utilisateur, plus récentes en premier.
   */
  async findByRecipient(recipientId: string, limit = 80): Promise<AppNotification[]> {
    if (!Types.ObjectId.isValid(recipientId)) return [];
    return this.model
      .find({ recipientId: new Types.ObjectId(recipientId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<AppNotification[]>;
  }

  async countUnread(recipientId: string): Promise<number> {
    if (!Types.ObjectId.isValid(recipientId)) return 0;
    return this.model
      .countDocuments({
        recipientId: new Types.ObjectId(recipientId),
        read: false,
      })
      .exec();
  }

  /**
   * Marque une notification comme lue si elle appartient au destinataire.
   */
  async markRead(notificationId: string, recipientId: string): Promise<{ ok: boolean }> {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(recipientId)) {
      throw new NotFoundException('Notification introuvable');
    }
    const res = await this.model
      .updateOne(
        {
          _id: new Types.ObjectId(notificationId),
          recipientId: new Types.ObjectId(recipientId),
        },
        { $set: { read: true } },
      )
      .exec();
    if (res.matchedCount === 0) {
      throw new NotFoundException('Notification introuvable');
    }
    return { ok: true };
  }
}
