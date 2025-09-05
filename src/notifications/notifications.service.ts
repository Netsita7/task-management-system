import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UsersService } from '../users/users.service';
import { TasksService } from '../tasks/tasks.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private usersService: UsersService,
    private tasksService: TasksService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const recipient = await this.usersService.findOne(createNotificationDto.recipientId);
    const notification = this.notificationsRepository.create({
      ...createNotificationDto,
      recipient,
    });

    if (createNotificationDto.taskId) {
      try {
        const task = await this.tasksService.findOne(
          createNotificationDto.taskId,
          recipient
        );
        notification.task = task;
      } catch (error) {
        // Task might not exist, but we can still create the notification
        console.warn('Task not found for notification:', createNotificationDto.taskId);
      }
    }

    return await this.notificationsRepository.save(notification);
  }

  async createTaskAssignmentNotification(
    recipientId: string,
    taskId: string,
    message: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.TASK_ASSIGNMENT,
      message,
      recipientId,
      taskId,
    });
  }

  async createIssueReportedNotification(
    recipientId: string,
    issueId: string,
    message: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.ISSUE_REPORTED,
      message,
      recipientId,
      taskId: undefined, // Use undefined instead of null
    });
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepository.find({ 
      relations: ['recipient', 'task'] 
    });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      relations: ['task'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationsRepository.count({
      where: { recipient: { id: userId }, isRead: false },
    });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    await this.notificationsRepository.update(id, { isRead: true });
    return this.notificationsRepository.findOne({ where: { id } });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { recipient: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async remove(id: string): Promise<void> {
    await this.notificationsRepository.delete(id);
  }

  @OnEvent('task.assigned')
  async handleTaskAssignedEvent(payload: { 
    recipientId: string; 
    taskId: string; 
    message: string; 
  }) {
    return this.createTaskAssignmentNotification(
      payload.recipientId,
      payload.taskId,
      payload.message
    );
  }

  @OnEvent('issue.reported')
  async handleIssueReportedEvent(payload: {
    recipientId: string;
    issueId: string;
    message: string;
  }) {
    return this.createIssueReportedNotification(
      payload.recipientId,
      payload.issueId,
      payload.message
    );
  } 
}