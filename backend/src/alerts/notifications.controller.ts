import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InAppNotificationService } from './in-app-notification.service';
import { AlertsService } from './alerts.service';

/**
 * Boîte de réception : notifications persistées + alertes retard filtrées par rôle.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly inAppNotificationService: InAppNotificationService,
    private readonly alertsService: AlertsService,
    private readonly userService: UserService,
  ) {}

  private async resolveUser(xUserId: string | undefined) {
    const userId = String(xUserId || '').trim();
    if (!userId) {
      throw new UnauthorizedException('x-user-id requis');
    }
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return { userId, role: String((user as any).role || '') };
  }

  /**
   * Notifications + alertes pour l’utilisateur connecté (header `x-user-id`).
   */
  @Get('inbox')
  async inbox(@Headers('x-user-id') xUserId: string | undefined) {
    const { userId, role } = await this.resolveUser(xUserId);
    const [notifications, alerts] = await Promise.all([
      this.inAppNotificationService.findByRecipient(userId),
      this.alertsService.listForInbox(userId, role),
    ]);
    return { notifications, alerts };
  }

  /**
   * Totaux pour badge « Nouveau » (non lues + alertes pending).
   */
  @Get('unread-count')
  async unreadCount(@Headers('x-user-id') xUserId: string | undefined) {
    const { userId, role } = await this.resolveUser(xUserId);
    const [notificationsUnread, alertsPending] = await Promise.all([
      this.inAppNotificationService.countUnread(userId),
      this.alertsService.countPendingForInbox(userId, role),
    ]);
    return {
      notificationsUnread,
      alertsPending,
      total: notificationsUnread + alertsPending,
    };
  }

  /**
   * Marque une notification comme lue.
   */
  @Patch(':id/read')
  async markRead(
    @Param('id') id: string,
    @Headers('x-user-id') xUserId: string | undefined,
  ) {
    const { userId } = await this.resolveUser(xUserId);
    if (!id?.trim()) {
      throw new BadRequestException('id requis');
    }
    return this.inAppNotificationService.markRead(id.trim(), userId);
  }
}
