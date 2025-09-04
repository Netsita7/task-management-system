import { IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ProjectStatus } from '../project.entity';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  deadline: Date;

  @IsNotEmpty()
  managerId: number;
}