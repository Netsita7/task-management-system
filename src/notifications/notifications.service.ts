import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './notification.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async createNotification(
    recipient: User,
    type: NotificationType,
    message: string,
    project?: Project,
    task?: Task,
    metadata?: any
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      recipient,
      type,
      message,
      project,
      task,
      metadata,
      status: NotificationStatus.UNREAD,
      isActive: true
    });

    return this.notificationsRepository.save(notification);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { 
        recipient: { id: userId }, 
        isActive: true 
      },
      relations: ['project', 'task'],
      order: { createdAt: 'DESC' },
      take: 50 
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, recipient: { id: userId } }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { recipient: { id: userId }, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ }
    );
  }

  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { id: notificationId, recipient: { id: userId } },
      { status: NotificationStatus.ARCHIVED }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { 
        recipient: { id: userId }, 
        status: NotificationStatus.UNREAD,
        isActive: true 
      }
    });
  }

  async createTaskAssignedNotification(assignee: User, task: Task): Promise<Notification> {
    const message = `You have been assigned to Task #${task.id.slice(-4)} - ${task.title}`;
    return this.createNotification(
      assignee,
      NotificationType.TASK_ASSIGNED,
      message,
      task.project,
      task,
      { taskId: task.id }
    );
  }

  async createTaskUpdatedNotification(user: User, task: Task, updateType: string, oldValue: any, newValue: any): Promise<Notification> {
    let message = '';
    
    switch (updateType) {
      case 'status':
        message = `Task #${task.id.slice(-4)} status updated to ${newValue}`;
        break;
      case 'dueDate':
        message = `The due date for Task #${task.id.slice(-4)} has been changed to ${new Date(newValue).toLocaleDateString()}`;
        break;
      case 'priority':
        message = `Task #${task.id.slice(-4)} priority updated to ${newValue}`;
        break;
      default:
        message = `Task #${task.id.slice(-4)} has been updated`;
    }

    return this.createNotification(
      user,
      NotificationType.TASK_UPDATED,
      message,
      task.project,
      task,
      { taskId: task.id, updateType, oldValue, newValue }
    );
  }

  async createMentionNotification(mentionedUser: User, task: Task, mentionedBy: User, comment: string): Promise<Notification> {
    const message = `${mentionedBy.firstName} mentioned you in Task #${task.id.slice(-4)}: "${comment.substring(0, 50)}..."`;
    
    return this.createNotification(
      mentionedUser,
      NotificationType.MENTION,
      message,
      task.project,
      task,
      { taskId: task.id, mentionedById: mentionedBy.id, comment }
    );
  }

  async createRoleChangeNotification(user: User, project: Project, newRole: string): Promise<Notification> {
    const message = `Your role in ${project.name} has been changed to ${newRole}`;
    
    return this.createNotification(
      user,
      NotificationType.ROLE_CHANGED,
      message,
      project,
      undefined,
      { projectId: project.id, newRole }
    );
  }

  async createDeadlineReminder(user: User, task: Task, daysUntilDue: number): Promise<Notification> {
    const message = daysUntilDue > 0 
      ? `Task #${task.id.slice(-4)} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
      : `Task #${task.id.slice(-4)} is overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? 's' : ''}`;
    
    return this.createNotification(
      user,
      NotificationType.DEADLINE_REMINDER,
      message,
      task.project,
      task,
      { taskId: task.id, daysUntilDue }
    );
  }

  async createNewIssueNotification(users: User[], project: Project, issueTitle: string): Promise<Notification[]> {
    const message = `New issue reported in ${project.name}: "${issueTitle}"`;
    
    const notifications = await Promise.all(
      users.map(user => 
        this.createNotification(
          user,
          NotificationType.NEW_ISSUE,
          message,
          project,
          undefined,
          { projectId: project.id, issueTitle }
        )
      )
    );

    return notifications;
  }

  async createTaskCompletedNotification(assignee: User, task: Task, completedBy: User): Promise<Notification> {
    const message = completedBy.id === assignee.id
      ? `You marked Task #${task.id.slice(-4)} as completed`
      : `Task #${task.id.slice(-4)} has been marked as completed by ${completedBy.firstName}`;
    
    return this.createNotification(
      assignee,
      NotificationType.TASK_COMPLETED,
      message,
      task.project,
      task,
      { taskId: task.id, completedById: completedBy.id }
    );
  }
}