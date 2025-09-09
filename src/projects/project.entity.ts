import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';
import { ProjectMember } from './project-member.entity';
import { IssueType } from './enums/issue-type.enum';
import { Task } from '../tasks/task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { eager: true })
  creator: User;

  @ManyToOne(() => User, { eager: true })
  admin: User;

  @OneToMany(() => ProjectMember, member => member.project)
  members: ProjectMember[];

  @Column({
    type: 'enum',
    enum: IssueType,
    array: true,
    default: [IssueType.TASK, IssueType.BUG, IssueType.STORY, IssueType.EPIC]
  })
  issueTypes: IssueType[];

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
  issues: any;

  isUserAdmin(userId: string): boolean {
    return this.admin.id === userId;
  }

  isUserMember(userId: string): boolean {
    return this.members.some(member => member.user.id === userId);
  }
}