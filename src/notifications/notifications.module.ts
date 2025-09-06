import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
// import { ReminderService } from './reminder.service';
import { NotificationListener } from './notification.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UsersModule,
    forwardRef(() => TasksModule),
    forwardRef(() => ProjectsModule), 
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService,  NotificationListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}