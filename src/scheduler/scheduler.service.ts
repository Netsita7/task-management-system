import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, MoreThan } from 'typeorm';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Project, ProjectStatus } from '../projects/project.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkDeadlines() {
    this.logger.log('Checking for upcoming deadlines...');
    
    // Check tasks with deadlines in the next 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const upcomingTasks = await this.tasksRepository.find({
      where: {
        deadline: LessThanOrEqual(twoDaysFromNow),
        status: Not(TaskStatus.COMPLETED), // Exclude completed tasks
      },
      relations: ['assignee', 'project'],
    });
    
    for (const task of upcomingTasks) {
      if (task.assignee) {
        await this.notificationsService.create({
          type: NotificationType.DEADLINE_REMINDER,
          message: `Task "${task.title}" is due on ${task.deadline.toDateString()}`,
          recipientId: task.assignee.id,
          taskId: task.id,
        });
      }
    }
    
    // Check project deadlines
    const upcomingProjects = await this.projectsRepository.find({
      where: {
        deadline: LessThanOrEqual(twoDaysFromNow),
        status: Not(ProjectStatus.COMPLETED), // Exclude completed projects
      },
      relations: ['manager'],
    });
    
    for (const project of upcomingProjects) {
      if (project.manager) {
        await this.notificationsService.create({
          type: NotificationType.DEADLINE_REMINDER,
          message: `Project "${project.name}" is due on ${project.deadline.toDateString()}`,
          recipientId: project.manager.id,
          taskId: null,
        });
      }
    }
    
    this.logger.log(`Sent ${upcomingTasks.length + upcomingProjects.length} deadline reminders`);
  }
}