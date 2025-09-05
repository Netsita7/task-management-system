import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ProjectRole } from '../enums/project-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address to invite',
    example: 'newmember@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Role for the invited member',
    enum: ProjectRole,
    example: ProjectRole.MEMBER
  })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}