// src/tasks/tasks.service.ts
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
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private projectsService: ProjectsService,
    private eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const project = await this.projectsService.findOne(createTaskDto.projectId, user);
    
    let assignee: User | undefined = undefined;
    if (createTaskDto.assigneeId) {
      const foundUser = await this.usersService.findOne(createTaskDto.assigneeId);
      if (!foundUser) {
        throw new NotFoundException('Assignee not found');
      }
      assignee = foundUser;
    }

    // Create task 
    const taskData: Partial<Task> = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority,
      project: project,
      reporter: user,
      assignee: assignee,
    };

    if (createTaskDto.dueDate) {
      const dueDate = new Date(createTaskDto.dueDate);
      taskData.dueDate = isNaN(dueDate.getTime()) ? undefined : dueDate;
    }

    const task = this.tasksRepository.create(taskData);
    const savedTask = await this.tasksRepository.save(task);

    // Emit event for notification if assignee exists
    if (assignee) {
      this.eventEmitter.emit('task.assigned', {
        recipientId: assignee.id,
        taskId: savedTask.id,
        message: `You have been assigned to task: ${savedTask.title}`,
      });
    }

    return savedTask;
  }

  async findAll(projectId: string, user: User): Promise<Task[]> {
    const project = await this.projectsService.findOne(projectId, user);
    
    return this.tasksRepository.find({
      where: { project: { id: projectId }, isActive: true },
      relations: ['project', 'assignee', 'reporter'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, isActive: true },
      relations: ['project', 'assignee', 'reporter'],
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

    const updateData: Partial<Task> = {};
    
    // Update only the fields that are provided
    if (updateTaskDto.title !== undefined) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) updateData.description = updateTaskDto.description;
    if (updateTaskDto.status !== undefined) updateData.status = updateTaskDto.status;
    if (updateTaskDto.priority !== undefined) updateData.priority = updateTaskDto.priority;
    
    if (updateTaskDto.dueDate !== undefined) {
      if (updateTaskDto.dueDate) {
        const dueDate = new Date(updateTaskDto.dueDate);
        updateData.dueDate = isNaN(dueDate.getTime()) ? undefined : dueDate;
      } else {
        updateData.dueDate = undefined;
      }
    }

    let assigneeChanged = false;
    if (updateTaskDto.assigneeId !== undefined) {
      if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== task.assignee?.id) {
        const assignee = await this.usersService.findOne(updateTaskDto.assigneeId);
        if (!assignee) {
          throw new NotFoundException('Assignee not found');
        }
        updateData.assignee = assignee;
        assigneeChanged = true;
      } else if (updateTaskDto.assigneeId === null || updateTaskDto.assigneeId === '') {
        // Handle unassigning the task
        updateData.assignee = undefined;
        assigneeChanged = true;
      }
    }

    await this.tasksRepository.update(id, updateData);

    // Emit event for notification if assignee changed and new assignee exists
    if (assigneeChanged && updateData.assignee) {
      this.eventEmitter.emit('task.assigned', {
        recipientId: updateData.assignee.id,
        taskId: id,
        message: `You have been assigned to task: ${task.title}`,
      });
    }

    // Add status/priority/due date change notifications:
    if (updateTaskDto.status !== undefined && updateTaskDto.status !== task.status) {
      this.eventEmitter.emit('task.updated', {
        recipientId: task.assignee?.id,
        taskId: id,
        message: `Task status changed to: ${updateTaskDto.status}`
      });
    }

    if (updateTaskDto.priority !== undefined && updateTaskDto.priority !== task.priority) {
      this.eventEmitter.emit('task.updated', {
        recipientId: task.assignee?.id,
        taskId: id,
        message: `Task priority changed to: ${updateTaskDto.priority}`
      });
    }

    if (updateTaskDto.dueDate !== undefined && updateTaskDto.dueDate !== task.dueDate) {
      this.eventEmitter.emit('task.updated', {
        recipientId: task.assignee?.id,
        taskId: id,
        message: `Task due date changed to: ${updateTaskDto.dueDate}`
      });
    }
    
    const updatedTask = await this.tasksRepository.findOne({ 
      where: { id },
      relations: ['project', 'assignee', 'reporter']
    });
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
    return this.findAll(projectId, user);
  }
  
  async findUpcomingDeadlines(): Promise<Task[]> {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    return this.tasksRepository.find({
      where: {
        dueDate: LessThanOrEqual(twoDaysFromNow),
        status: Not(TaskStatus.DONE),
        isActive: true,
      },
      relations: ['assignee', 'project'],
    });
  }
}