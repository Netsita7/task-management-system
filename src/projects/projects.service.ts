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
import { MailService } from '../mail/mail.service'; 
import { JwtService } from '@nestjs/jwt';
import { ProjectInvitation } from './invitation.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { InvitationStatus } from './invitation.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ProjectMember)
    private projectMembersRepository: Repository<ProjectMember>,
    @InjectRepository(ProjectInvitation)
    private invitationRepository: Repository<ProjectInvitation>,
    private mailService: MailService,
    private jwtService: JwtService,
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

  // Add this method to invite members
  async inviteMember(projectId: string, inviteMemberDto: InviteMemberDto, user: User): Promise<ProjectInvitation> {
    const project = await this.findOne(projectId, user);
    
    // Only admin can invite members
    if (!project.isUserAdmin(user.id)) {
      throw new ForbiddenException('Only project admin can invite members');
    }

    // Check if user is already a member
    const existingMember = project.members.find(member => 
      member.user.email === inviteMemberDto.email
    );
    if (existingMember) {
      throw new ForbiddenException('User is already a member of this project');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        project: { id: projectId },
        email: inviteMemberDto.email,
        status: InvitationStatus.PENDING,
        isActive: true
      }
    });
    if (existingInvitation) {
      throw new ForbiddenException('Invitation already sent to this email');
    }

    // Create invitation token
    const token = this.jwtService.sign({
      projectId,
      email: inviteMemberDto.email,
      role: inviteMemberDto.role || ProjectRole.MEMBER
    }, { expiresIn: '7d' });

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = this.invitationRepository.create({
      project,
      email: inviteMemberDto.email,
      role: inviteMemberDto.role || ProjectRole.MEMBER,
      invitedBy: user,
      token,
      expiresAt
    });

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Send invitation email
    await this.mailService.sendInvitationEmail(
      inviteMemberDto.email,
      user.email,
      project.name,
      token
    );

    return savedInvitation;
  }

  // Add this method to accept invitations
  async acceptInvitation(token: string, user: User): Promise<ProjectMember> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new ForbiddenException('Invalid or expired invitation token');
    }

    // Find the invitation
    const invitation = await this.invitationRepository.findOne({
      where: { token, isActive: true },
      relations: ['project']
    });

    if (!invitation || invitation.email !== user.email) {
      throw new ForbiddenException('Invalid invitation');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException('Invitation already processed');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new ForbiddenException('Invitation has expired');
    }

    // Add user to project
    const member = await this.addMemberToProject(
      invitation.project,
      user,
      invitation.role
    );

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return member;
  }

  // Update your addMember method to handle existing users
  // async addMember(projectId: string, addMemberDto: AddMemberDto, user: User): Promise<ProjectMember> {
  //   const project = await this.findOne(projectId, user);
    
  //   // Only admin can add members
  //   if (!project.isUserAdmin(user.id)) {
  //     throw new ForbiddenException('Only project admin can add members');
  //   }

  //   // Check if user is already a member
  //   const existingMember = project.members.find(member => member.user.id === addMemberDto.userId);
  //   if (existingMember) {
  //     throw new ForbiddenException('User is already a member of this project');
  //   }

  //   // Find the user by ID
  //   const userToAdd = await this.usersRepository.findOne({
  //     where: { id: addMemberDto.userId }
  //   });

  //   if (!userToAdd) {
  //     throw new NotFoundException('User not found');
  //   }

  //   return this.addMemberToProject(project, userToAdd, addMemberDto.role || ProjectRole.MEMBER);
  // }
}