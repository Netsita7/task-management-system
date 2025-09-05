import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Project created successfully' 
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
    description: 'Forbidden - project key already exists' 
  })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for the current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of projects retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project details retrieved successfully' 
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
    description: 'Project not found' 
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Project updated successfully' 
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
    description: 'Forbidden - only project admin can update' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project not found' 
  })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only project admin can delete' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project not found' 
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.projectsService.remove(id, req.user);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Member added successfully' 
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
    description: 'Forbidden - only project admin can add members or user already exists' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project not found' 
  })
  addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.projectsService.addMember(id, addMemberDto, req.user);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: '76284197-775f-423e-bf0b-fb25544f68e7' })
  @ApiParam({ name: 'memberId', description: 'Member User ID', example: '52b1e09f-7f97-4eaa-9df2-94f9f240b7e5' })
  @ApiResponse({ 
    status: 200, 
    description: 'Member removed successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - only project admin can remove members or cannot remove yourself' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Project or member not found' 
  })
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req) {
    return this.projectsService.removeMember(id, memberId, req.user);
  }
}