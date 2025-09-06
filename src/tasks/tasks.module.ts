import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './task.entity';
import { UsersModule } from '../users/users.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module'; 
import { ReminderService } from '../notifications/reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    UsersModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => ProjectsModule), 
  ],
  controllers: [TasksController],
  providers: [TasksService, ReminderService],
  exports: [TasksService],
})
export class TasksModule {}