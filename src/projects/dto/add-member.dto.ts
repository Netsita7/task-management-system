import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ProjectRole } from '../enums/project-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({
    description: 'User ID to add as member',
    example: '52b1e09f-7f97-4eaa-9df2-94f9f240b7e5'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Role of the member in the project',
    enum: ProjectRole,
    example: ProjectRole.MEMBER
  })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}