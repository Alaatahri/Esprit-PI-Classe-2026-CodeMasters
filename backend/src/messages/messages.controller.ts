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

  @Get('conversations')
  conversations(@Headers('x-user-id') userId?: string) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.messagesService.listConversations(id);
  }

  @Get('unread-count')
  unreadCount(@Headers('x-user-id') userId?: string) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.messagesService.countUnread(id);
  }

  @Get('with/:otherUserId')
  thread(
    @Headers('x-user-id') userId: string,
    @Param('otherUserId') otherUserId: string,
  ) {
    const id = userId?.trim();
    if (!id) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.messagesService.getThread(id, otherUserId);
  }

  @Post()
  send(
    @Headers('x-user-id') fromUserId: string,
    @Body() body: { toUserId?: string; body?: string },
  ) {
    const from = fromUserId?.trim();
    if (!from) {
      throw new BadRequestException('En-tête x-user-id requis.');
    }
    return this.messagesService.send(
      from,
      String(body?.toUserId ?? ''),
      String(body?.body ?? ''),
    );
  }
}
