import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksService } from '../tasks/tasks.service'; 

@Injectable()
export class ReminderService {
  constructor(
    private tasksService: TasksService, 
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkDeadlines() {
    const now = new Date();
    
    const tasks = await this.tasksService.findUpcomingDeadlines();

    for (const task of tasks) {
      if (task.dueDate && task.assignee) {
        const timeDiff = task.dueDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff <= 7 && daysDiff >= -7) {
          this.eventEmitter.emit('deadline.reminder', task.assignee, task, daysDiff);
        }
      }
    }
  }
}