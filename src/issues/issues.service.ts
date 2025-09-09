import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Issue, IssueStatus } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../users/user.entity';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createIssueDto: CreateIssueDto, user: User): Promise<Issue> {
    const project = await this.projectsService.findOne(String(createIssueDto.projectId), user);
    
    const issue = this.issuesRepository.create({
      ...createIssueDto,
      project,
      reporter: user,
    });

    const savedIssue = await this.issuesRepository.save(issue);

    this.eventEmitter.emit('issue.reported', {
      recipientId: project.admin.id,
      issueId: savedIssue.id,
      message: `New issue reported: ${savedIssue.title}`,
    });

    return savedIssue;
  }

  async findOne(id: string, user: User): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'reporter', 'assignee', 'task'],
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    if (!issue.project.isUserAdmin(user.id) && !issue.project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have access to this issue');
    }

    return issue;
  }

  async getProjectIssues(projectId: string, user: User): Promise<Issue[]> {
    return this.findByProjectId(projectId, user);
  }

  async update(id: string, updateIssueDto: UpdateIssueDto, user: User): Promise<Issue> {
    const issue = await this.findOne(id, user);
    
    if (!issue.project.isUserAdmin(user.id) && !issue.project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have permission to update this issue');
    }

    if (updateIssueDto.status === IssueStatus.RESOLVED && issue.status !== IssueStatus.RESOLVED) {
      (updateIssueDto as any).resolvedAt = new Date();
    }

    await this.issuesRepository.update(id, updateIssueDto);
    const updatedIssue = await this.issuesRepository.findOne({ where: { id } });
    if (!updatedIssue) {
      throw new NotFoundException('Issue not found after update');
    }
    return updatedIssue;
  }

  async remove(id: string, user: User): Promise<void> {
    const issue = await this.findOne(id, user);
    
    if (!issue.project.isUserAdmin(user.id) && issue.reporter.id !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this issue');
    }

    await this.issuesRepository.update(id, { isActive: false });
  }

  async findByProjectId(projectId: string, user: User): Promise<Issue[]> {
    const project = await this.projectsService.findOne(projectId, user);
    
    return this.issuesRepository.find({
      where: { project: { id: projectId }, isActive: true },
      relations: ['reporter', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  // Add a new method to get all issues for user (across all projects)
  async findAllForUser(user: User): Promise<Issue[]> {
    // Get all projects the user has access to
    const projects = await this.projectsService.findAll(user);
    const projectIds = projects.map(project => project.id);
    
    return this.issuesRepository.find({
      where: { project: { id: In(projectIds) }, isActive: true },
      relations: ['project', 'reporter', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }
}