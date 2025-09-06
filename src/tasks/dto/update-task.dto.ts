import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { TaskStatus, TaskPriority } from '../task.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Priority of the task',
    enum: TaskPriority,
    example: TaskPriority.URGENT
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Due date of the task (ISO format)',
    example: '2025-09-20'
  })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'ID of the user assigned to the task',
    example: '52b1e09f-7f97-4eaa-9df2-94f9f240b7e5'
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Title of the task',
    example: 'Updated task title'
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the task',
    example: 'Updated task description'
  })
  @IsString()
  @IsOptional()
  description?: string;
}