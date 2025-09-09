import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './notification.entity';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: any) {
    const { recipientId, taskId, message } = payload;
    
    await this.notificationsService.createNotification(
      { id: recipientId } as any,
      NotificationType.TASK_ASSIGNED, 
      message,
      undefined,
      { id: taskId } as any
    );
  }

  // Handle project invitation events
  @OnEvent('project.invitation.sent')
  async handleProjectInvitation(payload: any) {
    const { recipientId, projectId, inviterName, projectName } = payload;
    
    const message = `You have been invited to join ${projectName} by ${inviterName}.`;
    
    await this.notificationsService.createNotification(
      { id: recipientId } as any,
      NotificationType.PROJECT_INVITATION, 
      message,
      { id: projectId } as any
    );
  }

  // Handle schedule adjustment events
  @OnEvent('schedule.adjustment.requested')
  async handleAdjustmentRequest(payload: any) {
    const { projectId, taskId, taskTitle, recipientId } = payload;
    
    const message = `Schedule adjustment requested for task: ${taskTitle}`;
    
    await this.notificationsService.createNotification(
      { id: recipientId } as any,
      NotificationType.SCHEDULE_ADJUSTMENT,
      message,
      { id: projectId } as any,
      { id: taskId } as any
    );
  }

  @OnEvent('schedule.adjustment.approved')
  async handleAdjustmentApproved(payload: any) {
    const { projectId, taskId, taskTitle, recipientId } = payload;
    
    const message = `Schedule adjustment approved for task: ${taskTitle}`;
    
    await this.notificationsService.createNotification(
      { id: recipientId } as any,
      NotificationType.SCHEDULE_ADJUSTMENT,
      message,
      { id: projectId } as any,
      { id: taskId } as any
    );
  }

  @OnEvent('schedule.adjustment.rejected')
  async handleAdjustmentRejected(payload: any) {
    const { projectId, taskId, taskTitle, reason, recipientId } = payload;
    
    const message = `Schedule adjustment rejected for task: ${taskTitle}. Reason: ${reason}`;
    
    await this.notificationsService.createNotification(
      { id: recipientId } as any,
      NotificationType.SCHEDULE_ADJUSTMENT, 
      message,
      { id: projectId } as any,
      { id: taskId } as any
    );
  }

  // Handle deadline reminder events
  @OnEvent('deadline.reminder')
  async handleDeadlineReminder(user: any, task: any, daysUntilDue: number) {
    const message = daysUntilDue > 0 
      ? `Task #${task.id.slice(-4)} is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
      : `Task #${task.id.slice(-4)} is overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? 's' : ''}`;
    
    await this.notificationsService.createNotification(
      user,
      NotificationType.DEADLINE_REMINDER,
      message,
      task.project,
      task,
      { taskId: task.id, daysUntilDue }
    );
  }
}