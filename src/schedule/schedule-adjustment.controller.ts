import {
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  Patch 
} from '@nestjs/common';
import { ScheduleAdjustmentService } from './schedule-adjustment.service';
import { CreateScheduleAdjustmentDto } from './dto/create-schedule-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('Schedule Adjustments')
@ApiBearerAuth()
@Controller('projects/:projectId/schedule-adjustments')
@UseGuards(JwtAuthGuard)
export class ScheduleAdjustmentController {
  constructor(private readonly scheduleAdjustmentService: ScheduleAdjustmentService) {}

  @Get('workload-analysis')
  @ApiOperation({ summary: 'Analyze team workload for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workload analysis retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the project' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project not found' 
  })
  async analyzeTeamWorkload(
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    return this.scheduleAdjustmentService.analyzeTeamWorkload(projectId, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Request a schedule adjustment' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiBody({ type: CreateScheduleAdjustmentDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Adjustment request created successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the project' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task or project not found' 
  })
  async requestAdjustment(
    @Param('projectId') projectId: string,
    @Body() createDto: CreateScheduleAdjustmentDto,
    @Request() req
  ) {
    return this.scheduleAdjustmentService.requestAdjustment(createDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedule adjustments for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Adjustments retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the project' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project not found' 
  })
  async getProjectAdjustments(
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    return this.scheduleAdjustmentService.getProjectAdjustments(projectId, req.user);
  }

  @Patch(':adjustmentId/approve')
  @ApiOperation({ summary: 'Approves a schedule adjustment' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'adjustmentId', description: 'Adjustment ID', example: 'c5d2f7a1-b3e6-4a8d-9f2c-1b3e6d4a8f9c' })
  @ApiResponse({ 
    status: 200, 
    description: 'Adjustment approved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only project admins can approve adjustments' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adjustment not found' 
  })
  async approveAdjustment(
    @Param('projectId') projectId: string,
    @Param('adjustmentId') adjustmentId: string,
    @Request() req
  ) {
    return this.scheduleAdjustmentService.approveAdjustment(adjustmentId, req.user);
  }

  @Patch(':adjustmentId/reject')
  @ApiOperation({ summary: 'Reject a schedule adjustment' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'adjustmentId', description: 'Adjustment ID', example: 'c5d2f7a1-b3e6-4a8d-9f2c-1b3e6d4a8f9c' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Team member has capacity for more tasks' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Adjustment rejected successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only project admins can reject adjustments' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Adjustment not found' 
  })
  async rejectAdjustment(
    @Param('projectId') projectId: string,
    @Param('adjustmentId') adjustmentId: string,
    @Body() body: { reason: string },
    @Request() req
  ) {
    return this.scheduleAdjustmentService.rejectAdjustment(adjustmentId, req.user, body.reason);
  }

  @Get('tasks/:taskId/optimal-reassignment')
  @ApiOperation({ summary: 'Find optimal reassignment options for a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'taskId', description: 'Task ID', example: 'aa28e178-00b7-4d67-bc33-614de6b7a254' })
  @ApiResponse({ 
    status: 200, 
    description: 'Optimal reassignment options retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only project admins can access this endpoint' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found' 
  })
  async findOptimalReassignment(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Request() req
  ) {
    return this.scheduleAdjustmentService.findOptimalReassignment(taskId, req.user);
  }
}