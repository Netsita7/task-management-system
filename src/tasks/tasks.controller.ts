// import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
// import { TasksService } from './tasks.service';
// import { CreateTaskDto } from './dto/create-task.dto';
// import { UpdateTaskDto } from './dto/update-task.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// @Controller('projects/:projectId/tasks')
// @UseGuards(JwtAuthGuard)
// export class TasksController {
//   constructor(private readonly tasksService: TasksService) {}

//   @Post()
//   create(
//     @Param('projectId') projectId: string,
//     @Body() createTaskDto: CreateTaskDto,
//     @Request() req
//   ) {
    
//     createTaskDto.projectId = projectId;
//     return this.tasksService.create(createTaskDto, req.user);
//   }

//   @Get()
//   findAll(@Param('projectId') projectId: string, @Request() req) {
//     return this.tasksService.findAll(projectId, req.user);
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string, @Param('projectId') projectId: string, @Request() req) {
//     return this.tasksService.findOne(id, req.user);
//   }

//   @Patch(':id')
//   update(
//     @Param('id') id: string,
//     @Param('projectId') projectId: string,
//     @Body() updateTaskDto: UpdateTaskDto,
//     @Request() req
//   ) {
//     return this.tasksService.update(id, updateTaskDto, req.user);
//   }

//   @Delete(':id')
//   remove(
//     @Param('id') id: string,
//     @Param('projectId') projectId: string,
//     @Request() req
//   ) {
//     return this.tasksService.remove(id, req.user);
//   }
// }
// tasks.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Task created successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the project' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project or assignee not found' 
  })
  create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Request() req
  ) {
    createTaskDto.projectId = projectId;
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of tasks retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the project' 
  })
  findAll(@Param('projectId') projectId: string, @Request() req) {
    return this.tasksService.findAll(projectId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'aa28e178-00b7-4d67-bc33-614de6b7a254' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task details retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have access to the task' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found' 
  })
  findOne(@Param('id') id: string, @Param('projectId') projectId: string, @Request() req) {
    return this.tasksService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'aa28e178-00b7-4d67-bc33-614de6b7a254' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Task updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have permission to update the task' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task or assignee not found' 
  })
  update(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'id', description: 'Task ID', example: 'aa28e178-00b7-4d67-bc33-614de6b7a254' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user does not have permission to delete the task' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found' 
  })
  remove(
    @Param('id') id: string,
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    return this.tasksService.remove(id, req.user);
  }
}