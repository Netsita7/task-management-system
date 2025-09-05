import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { ProjectRole } from './enums/project-role.enum';

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, project => project.members, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.MEMBER
  })
  role: ProjectRole;

  @Column({ default: true })
  isActive: boolean;
}