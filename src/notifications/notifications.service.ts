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
      const task = await this.tasksService.findOne(createNotificationDto.taskId);
      notification.task = task;
    }

    return await this.notificationsRepository.save(notification);
  }

  async createTaskAssignmentNotification(
    recipientId: string, // Change to string
    taskId: string, // Change to string
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
    recipientId: string, // Change to string
    issueId: string, // Change to string
    message: string,
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.ISSUE_REPORTED,
      message,
      recipientId,
      taskId: null, 
    });
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepository.find({ 
      relations: ['recipient', 'task'] 
    });
  }

  async findByUser(userId: string): Promise<Notification[]> { // Change to string
    return await this.notificationsRepository.find({
      where: { recipient: { id: userId } }, // Remove String() conversion
      relations: ['task'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<Notification | null> { // Change to string
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });
    
    if (!notification) {
      return null;
    }
    
    notification.isRead = true;
    return await this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> { // Change to string
    await this.notificationsRepository.update(
      { recipient: { id: userId }, isRead: false }, // Remove String() conversion
      { isRead: true },
    );
  }

  async remove(id: string): Promise<void> { // Change to string
    await this.notificationsRepository.delete(id);
  }

  @OnEvent('task.assigned')
  async handleTaskAssignedEvent(payload: { 
    recipientId: string; // Change to string
    taskId: string; // Change to string
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
    recipientId: string; // Change to string
    issueId: string; // Change to string
    message: string;
  }) {
    return this.createIssueReportedNotification(
      payload.recipientId,
      payload.issueId,
      payload.message
    );
  } 
}