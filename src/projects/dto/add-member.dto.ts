import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ProjectRole } from '../enums/project-role.enum';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}