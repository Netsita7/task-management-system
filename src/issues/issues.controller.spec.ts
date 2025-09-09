import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  create(@Body() createIssueDto: CreateIssueDto, @Request() req) {
    return this.issuesService.create(createIssueDto, req.user);
  }

  @Get()
  findAll(@Query('projectId') projectId: string, @Request() req) {
    if (projectId) {
      return this.issuesService.findByProjectId(projectId, req.user);
    }
    throw new Error('projectId query parameter is required');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.issuesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIssueDto: UpdateIssueDto, @Request() req) {
    return this.issuesService.update(id, updateIssueDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.issuesService.remove(id, req.user);
  }
}