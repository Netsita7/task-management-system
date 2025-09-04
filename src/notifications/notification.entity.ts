import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

export enum NotificationType {
  TASK_ASSIGNMENT = 'task_assignment',
  DEADLINE_REMINDER = 'deadline_reminder',
  STATUS_UPDATE = 'status_update',
  ISSUE_REPORTED = 'issue_reported',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, user => user.tasks)
  recipient: User;

  @ManyToOne(() => Task, task => task.project, { nullable: true })
  task: Task;
}