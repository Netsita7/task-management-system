import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assignment',
  TASK_UPDATED = 'task_updated',
  MENTION = 'mention',
  ROLE_CHANGED = 'role_changed',
  DEADLINE_REMINDER = 'deadline_reminder',
  NEW_ISSUE = 'new_issue',
  TASK_COMPLETED = 'task_completed',
  SCHEDULE_ADJUSTMENT = 'schedule_adjustment',
  PROJECT_INVITATION = 'project_invitation' 
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Column()
  message: string;

  @ManyToOne(() => Project, { nullable: true })
  project: Project;

  @ManyToOne(() => Task, { nullable: true })
  task: Task;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD
  })
  status: NotificationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}