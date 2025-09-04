// scheduler.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Task } from '../tasks/task.entity';
import { Project } from '../projects/project.entity';

@Module({
  imports: [
    ProjectsModule,
    TasksModule, 
    NotificationsModule,
    // TypeOrmModule.forFeature([Task, Project]),

  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}