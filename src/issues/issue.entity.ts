import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';

export enum IssueType {
  BUG = 'bug',
  TASK = 'task',
  STORY = 'story',
  EPIC = 'epic'
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

@Entity('issues')
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
resolvedAt: Date;

  @ManyToOne(() => Project, project => project.issues, { onDelete: 'CASCADE' })
  project: Project;

  // @OneToOne(() => Task, task => task.issue, { nullable: true })
  // @JoinColumn()
  // task: Task;

  @ManyToOne(() => User, { eager: true })
  reporter: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  assignee: User;

  @Column({
    type: 'enum',
    enum: IssueType,
    default: IssueType.BUG
  })
  type: IssueType;

  @Column({
    type: 'enum',
    enum: IssuePriority,
    default: IssuePriority.MEDIUM
  })
  priority: IssuePriority;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.OPEN
  })
  status: IssueStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}