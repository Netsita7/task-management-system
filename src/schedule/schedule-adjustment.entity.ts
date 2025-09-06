import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Project } from '../projects/project.entity';

export enum AdjustmentType {
  REASSIGNMENT = 'reassignment',
  DEADLINE_CHANGE = 'deadline_change',
  PRIORITY_CHANGE = 'priority_change',
  STATUS_CHANGE = 'status_change'
}

export enum AdjustmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented'
}

@Entity('schedule_adjustments')
export class ScheduleAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AdjustmentType
  })
  type: AdjustmentType;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task: Task;

  @ManyToOne(() => User, { nullable: true })
  previousAssignee: User;

  @ManyToOne(() => User, { nullable: true })
  newAssignee: User;

  @Column({ type: 'timestamp', nullable: true })
  previousDeadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  newDeadline: Date;

  @Column({ nullable: true })
  previousPriority: string;

  @Column({ nullable: true })
  newPriority: string;

  @Column({ nullable: true })
  previousStatus: string;

  @Column({ nullable: true })
  newStatus: string;

  @ManyToOne(() => User)
  requestedBy: User;

  @ManyToOne(() => User, { nullable: true })
  approvedBy: User;

  @Column({
    type: 'enum',
    enum: AdjustmentStatus,
    default: AdjustmentStatus.PENDING
  })
  status: AdjustmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  requestedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  implementedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;
}