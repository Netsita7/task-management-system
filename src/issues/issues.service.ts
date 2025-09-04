import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue, IssueStatus } from './issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { TasksService } from '../tasks/tasks.service';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private issuesRepository: Repository<Issue>,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createIssueDto: CreateIssueDto): Promise<Issue> {
    const project = await this.projectsService.findOne(createIssueDto.projectId);
    const issue = this.issuesRepository.create({
      ...createIssueDto,
      project,
    });

    if (createIssueDto.taskId) {
      const task = await this.tasksService.findOne(createIssueDto.taskId);
      issue.task = task;
    }

    const savedIssue = await this.issuesRepository.save(issue);
    
    // Notify project manager about the new issue
    await this.notificationsService.createIssueReportedNotification(
      project.manager.id,
      issue.id,
      `New issue reported: ${issue.title}`,
    );
    
    return savedIssue;
  }

  async findAll(): Promise<Issue[]> {
    return await this.issuesRepository.find({ 
      relations: ['project', 'task'] 
    });
  }

  async findOne(id: number): Promise<Issue> {
    const issue = await this.issuesRepository.findOne({
      where: { id },
      relations: ['project', 'task'],
    });
    if (!issue) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
    return issue;
  }

  async update(id: number, updateIssueDto: UpdateIssueDto): Promise<Issue> {
    const issue = await this.findOne(id);
    
    if (updateIssueDto.projectId) {
      const project = await this.projectsService.findOne(updateIssueDto.projectId);
      issue.project = project;
    }
    
    if (updateIssueDto.taskId) {
      const task = await this.tasksService.findOne(updateIssueDto.taskId);
      issue.task = task;
    }
    
    // Set resolvedAt if status changed to RESOLVED or CLOSED
    if (
      (updateIssueDto.status === IssueStatus.RESOLVED || 
       updateIssueDto.status === IssueStatus.CLOSED) &&
      issue.status !== updateIssueDto.status
    ) {
      issue.resolvedAt = new Date();
    }
    
    Object.assign(issue, updateIssueDto);
    return await this.issuesRepository.save(issue);
  }

  async remove(id: number): Promise<void> {
    const result = await this.issuesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Issue with ID ${id} not found`);
    }
  }

  async getProjectIssues(projectId: number): Promise<Issue[]> {
    return await this.issuesRepository.find({
      where: { project: { id: projectId } },
      relations: ['task'],
    });
  }
}