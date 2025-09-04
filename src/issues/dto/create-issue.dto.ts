import { IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { IssuePriority, IssueStatus } from '../issue.entity';

export class CreateIssueDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority: IssuePriority;

  @IsOptional()
  @IsEnum(IssueStatus)
  status: IssueStatus;

  @IsOptional()
  @IsNumber()
  taskId: number;

  @IsNotEmpty()
  projectId: number;
}