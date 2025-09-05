import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectMember } from './project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { User } from '../users/user.entity';
import { ProjectRole } from './enums/project-role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,

  ) {}

  async create(createProjectDto: CreateProjectDto, creator: User): Promise<Project> {
    const existingProject = await this.projectsRepository.findOne({
      where: { key: createProjectDto.key }
    });
    
    if (existingProject) {
      throw new ForbiddenException('Project key must be unique');
    }

    const project = this.projectsRepository.create({
      ...createProjectDto,
      creator,
      admin: creator,
    });

    const savedProject = await this.projectsRepository.save(project);
    
    
    

    return savedProject;
  }

  async findAll(user: User): Promise<Project[]> {
    return this.projectsRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('project.admin', 'admin')
      .leftJoinAndSelect('project.creator', 'creator')
      .where('project.isActive = :isActive', { isActive: true })
      .andWhere('(admin.id = :userId OR user.id = :userId)', { userId: user.id })
      .getMany();
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id, isActive: true },
      relations: ['members', 'members.user', 'admin', 'creator', ]
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to the project
    if (!project.isUserAdmin(user.id) && !project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, user: User): Promise<Project> {
    const project = await this.findOne(id, user);
    
    // Only admin can update project
    if (!project.isUserAdmin(user.id)) {
      throw new ForbiddenException('Only project admin can update the project');
    }

    await this.projectsRepository.update(id, updateProjectDto);
    const updatedProject = await this.projectsRepository.findOne({ where: { id } });
    if (!updatedProject) {
      throw new NotFoundException('Project not found after update');
    }
    return updatedProject;
  }

  async remove(id: string, user: User): Promise<void> {
    const project = await this.findOne(id, user);
    
    // Only admin can delete project
    if (!project.isUserAdmin(user.id)) {
      throw new ForbiddenException('Only project admin can delete the project');
    }

    await this.projectsRepository.update(id, { isActive: false });
  }

  async addMember(projectId: string, addMemberDto: AddMemberDto, user: User): Promise<ProjectMember> {
    const project = await this.findOne(projectId, user);
    
    // Only admin can add members
    if (!project.isUserAdmin(user.id)) {
      throw new ForbiddenException('Only project admin can add members');
    }

    // Check if user is already a member
    const existingMember = project.members.find(member => member.user.id === addMemberDto.userId);
    if (existingMember) {
      throw new ForbiddenException('User is already a member of this project');
    }

    return this.addMemberToProject(project, { id: addMemberDto.userId } as User, addMemberDto.role || ProjectRole.MEMBER);
  }

  async removeMember(projectId: string, memberId: string, user: User): Promise<void> {
    const project = await this.findOne(projectId, user);
    
    // Only admin can remove members
    if (!project.isUserAdmin(user.id)) {
      throw new ForbiddenException('Only project admin can remove members');
    }

    // Cannot remove yourself
    if (memberId === user.id) {
      throw new ForbiddenException('Cannot remove yourself from project');
    }

    await this.projectMembersRepository.delete({ project: { id: projectId }, user: { id: memberId } });
  }

  private async addMemberToProject(project: Project, user: User, role: ProjectRole): Promise<ProjectMember> {
    const member = this.projectMembersRepository.create({
      project,
      user,
      role
    });

    return this.projectMembersRepository.save(member);
  }
}