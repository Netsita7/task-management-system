import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { Issue } from '../issues/issue.entity';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0-100 percentage

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @ManyToOne(() => User, user => user.tasks)
  assignee: User;

  @ManyToOne(() => Project, project => project.tasks)
  project: Project;

  @OneToOne(() => Issue, issue => issue.task, { nullable: true })
  @JoinColumn()
  issue: Issue;
}