import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsNumber()
  progress: number;

  @IsOptional()
  @IsDateString()
  deadline: Date;

  @IsOptional()
  assigneeId: number;

  @IsNotEmpty()
  projectId: number;
}