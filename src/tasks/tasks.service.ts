import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../users/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const project = await this.projectsService.findOne(String(createTaskDto.projectId), user);
    const assignee = await this.usersService.findOne(String(createTaskDto.assigneeId));
    
    const task = this.tasksRepository.create({
      ...createTaskDto,
      project,
      assignee,
      reporter: user,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Emit event for notification
    this.eventEmitter.emit('task.assigned', {
      recipientId: assignee.id,
      taskId: savedTask.id,
      message: `You have been assigned to task: ${savedTask.title}`,
    });

    return savedTask;
  }

  async findAll(projectId: string, user: User): Promise<Task[]> {
    const project = await this.projectsService.findOne(projectId, user);
    
    return this.tasksRepository.find({
      where: { project: { id: projectId }, isActive: true },
      relations: ['project', 'assignee', 'reporter', 'board'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'assignee', 'reporter', 'board'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to the project
    if (!task.project.isUserAdmin(user.id) && !task.project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    
    // Only project members can update tasks
    if (!task.project.isUserAdmin(user.id) && !task.project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    if (
      updateTaskDto.assigneeId &&
      String(updateTaskDto.assigneeId) !== String(task.assignee.id)
    ) {
      const assignee = await this.usersService.findOne(String(updateTaskDto.assigneeId));
      await this.tasksRepository.update(id, {
        ...updateTaskDto,
        assignee,
      });

      // Emit event for notification if assignee changed
      this.eventEmitter.emit('task.assigned', {
        recipientId: assignee.id,
        taskId: id,
        message: `You have been assigned to task: ${task.title}`,
      });
    } else {
      await this.tasksRepository.update(id, updateTaskDto);
    }
    
    const updatedTask = await this.tasksRepository.findOne({ where: { id } });
    if (!updatedTask) {
      throw new NotFoundException('Task not found');
    }
    return updatedTask;
  }

  async remove(id: string, user: User): Promise<void> {
    const task = await this.findOne(id, user);
    
    // Only admin or reporter can delete tasks
    if (!task.project.isUserAdmin(user.id) && task.reporter.id !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.tasksRepository.update(id, { isActive: false });
  }

  async findByUserId(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignee: { id: userId }, isActive: true },
      relations: ['project'],
    });
  }
  async getUserTasks(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignee: { id: userId }, isActive: true },
      relations: ['project'],
    });
  }

  async getProjectTasks(projectId: string, user: User): Promise<Task[]> {
    const project = await this.projectsService.findOne(projectId, user);
    return this.findAll(projectId, user);
  }
  
  async findUpcomingDeadlines(): Promise<Task[]> {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    return this.tasksRepository.find({
      where: {
        deadline: LessThanOrEqual(twoDaysFromNow),
        status: Not(TaskStatus.DONE),
        isActive: true,
      },
      relations: ['assignee', 'project'],
    });
  }
}