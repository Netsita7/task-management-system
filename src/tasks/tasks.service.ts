import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const project = await this.projectsService.findOne(createTaskDto.projectId);
    const task = this.tasksRepository.create({
      ...createTaskDto,
      project,
    });

    if (createTaskDto.assigneeId) {
      const assignee = await this.usersService.findOne(String(createTaskDto.assigneeId));
      task.assignee = assignee;
      
      // Emit event instead of calling notification service directly
      this.eventEmitter.emit('task.assigned', {
        recipientId: assignee.id,
        taskId: task.id,
        message: `You have been assigned a new task: ${task.title}`,
      });
    }

    const savedTask = await this.tasksRepository.save(task);
    
    // Update project progress
    await this.projectsService.updateProjectStatus(project.id);
    
    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return await this.tasksRepository.find({ 
      relations: ['assignee', 'project', 'issue'] 
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'project', 'issue'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    
    if (updateTaskDto.projectId) {
      const project = await this.projectsService.findOne(updateTaskDto.projectId);
      task.project = project;
    }
    
    if (updateTaskDto.assigneeId) {
      const assignee = await this.usersService.findOne(String(updateTaskDto.assigneeId));
      
      // Emit event if assignee changed
      if (task.assignee?.id !== assignee.id) {
        this.eventEmitter.emit('task.assigned', {
          recipientId: assignee.id,
          taskId: task.id,
          message: `You have been assigned to task: ${task.title}`,
        });
      }
      
      task.assignee = assignee;
    }
    
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);
    
    // Update project progress
    if (task.project) {
      await this.projectsService.updateProjectStatus(task.project.id);
    }
    
    return updatedTask;
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    const projectId = task.project.id;
    
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    
    // Update project progress
    await this.projectsService.updateProjectStatus(projectId);
  }

  async getUserTasks(userId: number): Promise<Task[]> {
    return await this.tasksRepository.find({
      where: { assignee: { id: String(userId) } },
      relations: ['project'],
    });
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    return await this.tasksRepository.find({
      where: { project: { id: projectId } },
      relations: ['assignee'],
    });
  }
}