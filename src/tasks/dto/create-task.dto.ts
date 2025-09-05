// import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
// import { TaskStatus, TaskPriority } from '../task.entity';

// export class CreateTaskDto {
//   @IsString()
//   @IsNotEmpty()
//   title: string;

//   @IsString()
//   @IsOptional()
//   description?: string;

//   @IsEnum(TaskStatus)
//   @IsOptional()
//   status?: TaskStatus;

//   @IsEnum(TaskPriority)
//   @IsOptional()
//   priority?: TaskPriority;

//   @IsDateString()
//   @IsOptional()
//   dueDate?: Date;

//   @IsString()
//   @IsOptional()  
//   projectId: string;

//   @IsString()
//   @IsOptional()
//   assigneeId?: string;
// }
// create-task.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TaskStatus, TaskPriority } from '../task.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Title of the task',
    example: 'Implement user authentication'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the task',
    example: 'Create login and registration endpoints'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the task',
    enum: TaskStatus,
    example: TaskStatus.TODO
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Priority of the task',
    enum: TaskPriority,
    example: TaskPriority.HIGH
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Due date of the task (ISO format)',
    example: '2025-09-15'
  })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Project ID (will be set from URL parameter)',
    example: '76284197-775f-423e-bf0b-fb25544f68e7'
  })
  @IsString()
  @IsOptional()  
  projectId: string;

  @ApiPropertyOptional({
    description: 'ID of the user assigned to the task',
    example: '52b1e09f-7f97-4eaa-9df2-94f9f240b7e5'
  })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}