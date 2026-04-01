import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly userService: UserService,
  ) {}

  private isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }

  async send(fromUserId: string, toUserId: string, body: string) {
    if (!this.isValidObjectId(fromUserId) || !this.isValidObjectId(toUserId)) {
      throw new BadRequestException('Identifiants utilisateur invalides.');
    }
    if (fromUserId === toUserId) {
      throw new BadRequestException('Impossible de vous envoyer un message à vous-même.');
    }
    const trimmed = String(body ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Le message ne peut pas être vide.');
    }
    if (trimmed.length > 8000) {
      throw new BadRequestException('Message trop long (max 8000 caractères).');
    }
    const toUser = await this.userService.findOne(toUserId);
    if (!toUser) {
      throw new NotFoundException('Destinataire introuvable.');
    }
    const fromUser = await this.userService.findOne(fromUserId);
    if (!fromUser) {
      throw new NotFoundException('Expéditeur introuvable.');
    }

    const doc = await this.messageModel.create({
      fromUserId: new Types.ObjectId(fromUserId),
      toUserId: new Types.ObjectId(toUserId),
      body: trimmed,
    });
    return doc.toObject();
  }

  async listConversations(userId: string) {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Identifiant invalide.');
    }
    const uid = new Types.ObjectId(userId);

    const rows = await this.messageModel
      .aggregate([
        {
          $match: {
            $or: [{ fromUserId: uid }, { toUserId: uid }],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ['$fromUserId', uid] }, '$toUserId', '$fromUserId'],
            },
            lastBody: { $first: '$body' },
            lastAt: { $first: '$createdAt' },
          },
        },
        { $sort: { lastAt: -1 } },
      ])
      .exec();

    const out: Array<{
      partnerId: string;
      lastBody: string;
      lastAt: Date;
      unread: number;
      partnerNom?: string;
      partnerRole?: string;
    }> = [];

    for (const r of rows) {
      const pid = (r._id as Types.ObjectId).toString();
      const unread = await this.messageModel.countDocuments({
        fromUserId: new Types.ObjectId(pid),
        toUserId: uid,
        $or: [{ readAt: { $exists: false } }, { readAt: null }],
      });
      const partner = await this.userService.findOne(pid);
      out.push({
        partnerId: pid,
        lastBody: r.lastBody as string,
        lastAt: r.lastAt as Date,
        unread,
        partnerNom: partner?.nom,
        partnerRole: partner?.role,
      });
    }

    return out;
  }

  async getThread(userId: string, otherUserId: string, limit = 200) {
    if (!this.isValidObjectId(userId) || !this.isValidObjectId(otherUserId)) {
      throw new BadRequestException('Identifiants invalides.');
    }
    const uid = new Types.ObjectId(userId);
    const oid = new Types.ObjectId(otherUserId);

    await this.messageModel
      .updateMany(
        { fromUserId: oid, toUserId: uid, $or: [{ readAt: { $exists: false } }, { readAt: null }] },
        { $set: { readAt: new Date() } },
      )
      .exec();

    const msgs = await this.messageModel
      .find({
        $or: [
          { fromUserId: uid, toUserId: oid },
          { fromUserId: oid, toUserId: uid },
        ],
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean()
      .exec();

    return msgs;
  }

  async countUnread(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) return 0;
    return this.messageModel.countDocuments({
      toUserId: new Types.ObjectId(userId),
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    });
  }
}
