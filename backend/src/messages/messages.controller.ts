import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  private requireUserId(raw?: string): string {
    const id = raw?.trim();
    if (!id) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return id;
  }

  @Get('conversations')
  conversations(@Headers('x-user-id') userId?: string) {
    return this.messagesService.getConversations(this.requireUserId(userId));
  }

  @Get('unread-count')
  async unreadCount(@Headers('x-user-id') userId?: string) {
    const n = await this.messagesService.getUnreadCount(
      this.requireUserId(userId),
    );
    return n;
  }

  @Get('with/:otherUserId')
  async thread(
    @Headers('x-user-id') userId: string | undefined,
    @Param('otherUserId') otherUserId: string,
  ) {
    const uid = this.requireUserId(userId);
    const rows = await this.messagesService.getThread(uid, otherUserId);
    await this.messagesService.markThreadRead(uid, otherUserId);
    return rows;
  }

  @Post()
  async send(
    @Headers('x-user-id') fromUserId: string | undefined,
    @Body() body: { toUserId?: string; body?: string },
  ) {
    const from = this.requireUserId(fromUserId);
    const to = body?.toUserId?.trim();
    const text = body?.body?.trim();
    if (!to) {
      throw new BadRequestException('toUserId est requis.');
    }
    if (!text) {
      throw new BadRequestException('Le message ne peut pas être vide.');
    }
    return this.messagesService.sendMessage(from, to, text);
  }
}
