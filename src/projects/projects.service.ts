import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private usersService: UsersService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const manager = await this.usersService.findOne(String(createProjectDto.managerId));
    const project = this.projectsRepository.create({
      ...createProjectDto,
      manager,
    });
    return await this.projectsRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return await this.projectsRepository.find({ relations: ['manager', 'tasks'] });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['manager', 'tasks', 'tasks.assignee'],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    
    if (updateProjectDto.managerId) {
      const manager = await this.usersService.findOne(String(updateProjectDto.managerId));
      project.manager = manager;
    }
    
    Object.assign(project, updateProjectDto);
    return await this.projectsRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const result = await this.projectsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }

  async calculateProgress(projectId: number): Promise<number> {
    const project = await this.findOne(projectId);
    if (!project.tasks || project.tasks.length === 0) {
      return 0;
    }
    
    const totalProgress = project.tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / project.tasks.length);
  }

  async updateProjectStatus(projectId: number): Promise<Project> {
    const project = await this.findOne(projectId);
    const progress = await this.calculateProgress(projectId);
    project.progress = progress;
    
    if (progress === 100) {
      project.status = ProjectStatus.COMPLETED;
    } else if (progress > 0) {
      project.status = ProjectStatus.IN_PROGRESS;
    } else {
      project.status = ProjectStatus.NOT_STARTED;
    }
    
    return await this.projectsRepository.save(project);
  }
}