import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ScheduleAdjustment, AdjustmentType, AdjustmentStatus } from './schedule-adjustment.entity';
import { CreateScheduleAdjustmentDto } from './dto/create-schedule-adjustment.dto';
import { Task, TaskStatus, TaskPriority } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface WorkloadAnalysis {
  userId: string;
  userName: string;
  totalTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  workloadScore: number;
}

@Injectable()
export class ScheduleAdjustmentService {
  constructor(
    @InjectRepository(ScheduleAdjustment)
    private adjustmentRepository: Repository<ScheduleAdjustment>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private eventEmitter: EventEmitter2,
  ) {}

  async analyzeTeamWorkload(projectId: string, requester: User): Promise<WorkloadAnalysis[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, isActive: true },
      relations: ['members', 'members.user']
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.isUserAdmin(requester.id) && !project.isUserMember(requester.id)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const tasks = await this.taskRepository.find({
      where: { 
        project: { id: projectId }, 
        isActive: true,
        status: Not(TaskStatus.DONE) as any
      },
      relations: ['assignee']
    });

    const members = project.members.map(member => member.user);

    const workloadAnalysis: WorkloadAnalysis[] = [];

    for (const member of members) {
      const memberTasks = tasks.filter(task => task.assignee && task.assignee.id === member.id);
      const highPriorityTasks = memberTasks.filter(task => 
        task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
      ).length;
      
      const now = new Date();
      const overdueTasks = memberTasks.filter(task => 
        task.dueDate && task.dueDate < now
      ).length;
      
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const upcomingDeadlines = memberTasks.filter(task => 
        task.dueDate && task.dueDate <= sevenDaysFromNow && task.dueDate >= now
      ).length;

      const workloadScore = memberTasks.length * 0.3 + 
                          highPriorityTasks * 0.4 + 
                          overdueTasks * 0.5 + 
                          upcomingDeadlines * 0.2;

      workloadAnalysis.push({
        userId: member.id,
        userName: `${member.firstName} ${member.lastName}`,
        totalTasks: memberTasks.length,
        highPriorityTasks,
        overdueTasks,
        upcomingDeadlines,
        workloadScore: Math.round(workloadScore * 100) / 100
      });
    }

    return workloadAnalysis.sort((a, b) => b.workloadScore - a.workloadScore);
  }

  async findOptimalReassignment(taskId: string, requester: User): Promise<User[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, isActive: true },
      relations: ['project', 'project.members', 'project.members.user', 'assignee']
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.project.isUserAdmin(requester.id)) {
      throw new ForbiddenException('Only project admins can find optimal reassignments');
    }

    const workloadAnalysis = await this.analyzeTeamWorkload(task.project.id, requester);
    
    const potentialAssignees = workloadAnalysis
      .filter(analysis => analysis.userId !== task.assignee?.id)
      .sort((a, b) => a.workloadScore - b.workloadScore);

    const topCandidateIds = potentialAssignees.slice(0, 3).map(analysis => analysis.userId);
    const candidates = await this.userRepository.findByIds(topCandidateIds);

    return candidates;
  }

  async requestAdjustment(createDto: CreateScheduleAdjustmentDto, requester: User): Promise<ScheduleAdjustment> {
    const task = await this.taskRepository.findOne({
      where: { id: createDto.taskId, isActive: true },
      relations: ['project', 'project.admin', 'assignee']
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.project.isUserAdmin(requester.id) && !task.project.isUserMember(requester.id)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    // Validate based on adjustment type
    if (createDto.type === AdjustmentType.REASSIGNMENT && !createDto.newAssigneeId) {
      throw new BadRequestException('New assignee ID is required for reassignment');
    }

    if (createDto.type === AdjustmentType.DEADLINE_CHANGE && !createDto.newDeadline) {
      throw new BadRequestException('New deadline is required for deadline change');
    }

    if (createDto.type === AdjustmentType.PRIORITY_CHANGE && !createDto.newPriority) {
      throw new BadRequestException('New priority is required for priority change');
    }

    if (createDto.type === AdjustmentType.STATUS_CHANGE && !createDto.newStatus) {
      throw new BadRequestException('New status is required for status change');
    }

    // Check if new assignee is a project member (for reassignments)
    if (createDto.type === AdjustmentType.REASSIGNMENT && createDto.newAssigneeId) {
      const isMember = task.project.members.some(
        member => member.user.id === createDto.newAssigneeId
      );
      
      if (!isMember) {
        throw new BadRequestException('New assignee must be a project member');
      }

      // Check new assignee's workload
      const newAssigneeWorkload = await this.getUserWorkload(createDto.newAssigneeId);
      if (newAssigneeWorkload.totalTasks >= 10) {
        throw new BadRequestException('New assignee has too many tasks already');
      }
    }

    // Create the adjustment request
    const adjustmentData: Partial<ScheduleAdjustment> = {
      type: createDto.type,
      task,
      previousAssignee: task.assignee,
      previousDeadline: task.dueDate,
      previousPriority: task.priority,
      previousStatus: task.status,
      requestedBy: requester,
      project: task.project,
      reason: createDto.reason,
      status: AdjustmentStatus.PENDING
    };

    // Add conditional fields
    if (createDto.newAssigneeId) {
      adjustmentData.newAssignee = { id: createDto.newAssigneeId } as User;
    }
    
    if (createDto.newDeadline) {
      adjustmentData.newDeadline = createDto.newDeadline;
    }
    
    if (createDto.newPriority) {
      adjustmentData.newPriority = createDto.newPriority;
    }
    
    if (createDto.newStatus) {
      adjustmentData.newStatus = createDto.newStatus;
    }

    const adjustment = this.adjustmentRepository.create(adjustmentData);
    const savedAdjustment = await this.adjustmentRepository.save(adjustment);

    // In requestAdjustment method, update the event:
    this.eventEmitter.emit('schedule.adjustment.requested', {
      projectId: task.project.id,
      taskId: task.id,
      taskTitle: task.title,
      recipientId: task.project.admin.id 
    });

    return savedAdjustment;
  }

  async approveAdjustment(adjustmentId: string, approver: User): Promise<ScheduleAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id: adjustmentId },
      relations: ['task', 'task.project', 'newAssignee', 'requestedBy']
    });

    if (!adjustment) {
      throw new NotFoundException('Adjustment request not found');
    }

    if (!adjustment.task.project.isUserAdmin(approver.id)) {
      throw new ForbiddenException('Only project admins can approve adjustments');
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Adjustment is not in pending status');
    }

    // Implement the adjustment
    const updateData: Partial<Task> = {};
    
    if (adjustment.type === AdjustmentType.REASSIGNMENT && adjustment.newAssignee) {
      updateData.assignee = adjustment.newAssignee;
    }
    
    if (adjustment.type === AdjustmentType.DEADLINE_CHANGE && adjustment.newDeadline) {
      updateData.dueDate = adjustment.newDeadline;
    }
    
    if (adjustment.type === AdjustmentType.PRIORITY_CHANGE && adjustment.newPriority) {
      updateData.priority = adjustment.newPriority as TaskPriority;
    }
    
    if (adjustment.type === AdjustmentType.STATUS_CHANGE && adjustment.newStatus) {
      updateData.status = adjustment.newStatus as TaskStatus;
    }

    await this.taskRepository.update(adjustment.task.id, updateData);

    adjustment.status = AdjustmentStatus.APPROVED;
    adjustment.approvedBy = approver;
    adjustment.implementedAt = new Date();

    const updatedAdjustment = await this.adjustmentRepository.save(adjustment);

    this.eventEmitter.emit('schedule.adjustment.approved', {
      projectId: adjustment.task.project.id,
      taskId: adjustment.task.id,
      taskTitle: adjustment.task.title,
      recipientId: adjustment.requestedBy.id 
    });

    return updatedAdjustment;
  }

  async rejectAdjustment(adjustmentId: string, rejecter: User, reason: string): Promise<ScheduleAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id: adjustmentId },
      relations: ['task', 'task.project', 'requestedBy']
    });

    if (!adjustment) {
      throw new NotFoundException('Adjustment request not found');
    }

    if (!adjustment.task.project.isUserAdmin(rejecter.id)) {
      throw new ForbiddenException('Only project admins can reject adjustments');
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Adjustment is not in pending status');
    }

    adjustment.status = AdjustmentStatus.REJECTED;
    adjustment.reason = reason;

    const updatedAdjustment = await this.adjustmentRepository.save(adjustment);

    this.eventEmitter.emit('schedule.adjustment.rejected', {
      projectId: adjustment.task.project.id,
      taskId: adjustment.task.id,
      taskTitle: adjustment.task.title,
      reason: reason,
      recipientId: adjustment.requestedBy.id 
    });

    return updatedAdjustment;
  }

  async getUserWorkload(userId: string): Promise<{ totalTasks: number, highPriorityTasks: number, overdueTasks: number }> {
    const tasks = await this.taskRepository.find({
      where: { 
        assignee: { id: userId }, 
        isActive: true,
        status: Not(TaskStatus.DONE) as any
      }
    });

    const now = new Date();
    const highPriorityTasks = tasks.filter(task => 
      task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
    ).length;
    
    const overdueTasks = tasks.filter(task => 
      task.dueDate && task.dueDate < now
    ).length;

    return {
      totalTasks: tasks.length,
      highPriorityTasks,
      overdueTasks
    };
  }

  async getProjectAdjustments(projectId: string, user: User): Promise<ScheduleAdjustment[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, isActive: true }
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.isUserAdmin(user.id) && !project.isUserMember(user.id)) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.adjustmentRepository.find({
      where: { project: { id: projectId } },
      relations: ['task', 'previousAssignee', 'newAssignee', 'requestedBy', 'approvedBy'],
      order: { requestedAt: 'DESC' }
    });
  }
}