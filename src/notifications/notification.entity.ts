import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';

export enum NotificationType {
  PROJECT_ASSIGNMENT = 'project_assignment',
  TASK_ASSIGNMENT = 'task_assignment',
  DEADLINE_REMINDER = 'deadline_reminder',
  ISSUE_REPORTED = 'issue_reported',
  PROJECT_REMINDER = "PROJECT_REMINDER",
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  recipient: User;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.PROJECT_ASSIGNMENT
  })
  type: NotificationType;

  @ManyToOne(() => Project, { nullable: true })
  project?: Project;

  @ManyToOne(() => Task, { nullable: true })
  task?: Task;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}