import { ApiProperty } from '@nestjs/swagger';

export enum ProjectRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// For better Swagger documentation
export const ProjectRoleApi = {
  type: 'string',
  enum: Object.values(ProjectRole),
  example: ProjectRole.MEMBER
} as const;