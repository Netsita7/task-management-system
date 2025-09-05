import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { ProjectRole } from './enums/project-role.enum';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

@Entity('project_invitations')
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.MEMBER
  })
  role: ProjectRole;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING
  })
  status: InvitationStatus;

  @ManyToOne(() => User, { nullable: true })
  invitedBy: User;

  @Column({ nullable: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;
}