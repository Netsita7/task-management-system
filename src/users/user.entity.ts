import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, CreateDateColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Project } from '../projects/project.entity';
import { Task } from '../tasks/task.entity';
import { Issue } from '../issues/issue.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column()
  @IsNotEmpty()
  firstName: string;

  @Column()
  @IsNotEmpty()
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Project, project => project.creator)
  createdProjects: Project[];

  @OneToMany(() => Project, project => project.admin)
  administeredProjects: Project[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, task => task.reporter)
  reportedTasks: Task[];

  @OneToMany(() => Issue, issue => issue.reporter)
  reportedIssues: Issue[];

  @OneToMany(() => Issue, issue => issue.assignee)
  assignedIssues: Issue[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}