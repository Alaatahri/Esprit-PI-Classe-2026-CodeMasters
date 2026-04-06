import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../user/user.module';
import { Alert, AlertSchema } from './schemas/alert.schema';
import {
  AppNotification,
  AppNotificationSchema,
} from './schemas/app-notification.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: AppNotification.name, schema: AppNotificationSchema },
    ]),
    ProjectModule,
    UserModule,
  ],
  controllers: [AlertsController, NotificationsController],
  providers: [AlertsService, InAppNotificationService, NotificationsService],
  exports: [AlertsService, NotificationsService, InAppNotificationService],
})
export class AlertsModule {}
