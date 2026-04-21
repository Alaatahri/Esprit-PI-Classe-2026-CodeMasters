import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

export type ConversationRowDto = {
  partnerId: string;
  lastBody: string;
  lastAt: string;
  unread: number;
  partnerNom?: string;
  partnerRole?: string;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private oid(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Identifiant invalide.');
    }
    return new Types.ObjectId(id);
  }

  async getConversations(userId: string): Promise<ConversationRowDto[]> {
    const uid = this.oid(userId);
    const list = await this.messageModel
      .find({
        $or: [{ fromUserId: uid }, { toUserId: uid }],
      })
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean()
      .exec();

    const lastByPartner = new Map<
      string,
      { lastBody: string; lastAt: Date }
    >();
    const unreadByPartner = new Map<string, number>();

    for (const m of list) {
      const from = String(m.fromUserId);
      const to = String(m.toUserId);
      const partnerId = from === userId ? to : from;

      if (!lastByPartner.has(partnerId)) {
        lastByPartner.set(partnerId, {
          lastBody: String(m.body ?? ''),
          lastAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        });
      }

      if (to === userId && from === partnerId && !m.readAt) {
        unreadByPartner.set(partnerId, (unreadByPartner.get(partnerId) ?? 0) + 1);
      }
    }

    const partnerIds = [...lastByPartner.keys()];
    const users = await this.userModel
      .find({ _id: { $in: partnerIds.map((id) => new Types.ObjectId(id)) } })
      .select('nom role')
      .lean()
      .exec();
    const nomById = new Map<string, { nom?: string; role?: string }>();
    for (const u of users as any[]) {
      nomById.set(String(u._id), { nom: u.nom, role: u.role });
    }

    const rows: ConversationRowDto[] = partnerIds.map((partnerId) => {
      const last = lastByPartner.get(partnerId)!;
      const meta = nomById.get(partnerId);
      return {
        partnerId,
        lastBody: last.lastBody,
        lastAt: last.lastAt.toISOString(),
        unread: unreadByPartner.get(partnerId) ?? 0,
        partnerNom: meta?.nom,
        partnerRole: meta?.role,
      };
    });

    rows.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    return rows;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const uid = this.oid(userId);
    return this.messageModel.countDocuments({
      toUserId: uid,
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    });
  }

  async getThread(userId: string, otherUserId: string): Promise<any[]> {
    const u = this.oid(userId);
    const o = this.oid(otherUserId);
    const list = await this.messageModel
      .find({
        $or: [
          { fromUserId: u, toUserId: o },
          { fromUserId: o, toUserId: u },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean()
      .exec();

    return list.map((m: any) => ({
      _id: String(m._id),
      fromUserId: String(m.fromUserId),
      toUserId: String(m.toUserId),
      body: m.body,
      readAt: m.readAt ? new Date(m.readAt).toISOString() : undefined,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
    }));
  }

  async sendMessage(
    fromUserId: string,
    toUserId: string,
    body: string,
  ): Promise<{ _id: string }> {
    const doc = await this.messageModel.create({
      fromUserId: this.oid(fromUserId),
      toUserId: this.oid(toUserId),
      body: body.trim(),
    });
    return { _id: String(doc._id) };
  }

  /** Marque comme lus les messages reçus de otherUserId par userId. */
  async markThreadRead(userId: string, otherUserId: string): Promise<void> {
    const uid = this.oid(userId);
    const o = this.oid(otherUserId);
    await this.messageModel.updateMany(
      { fromUserId: o, toUserId: uid, readAt: { $in: [null, undefined] } },
      { $set: { readAt: new Date() } },
    );
  }
}
