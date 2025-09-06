import { ApiProperty } from '@nestjs/swagger';

export enum IssueType {
  TASK = 'task',
  BUG = 'bug',
  STORY = 'story',
  EPIC = 'epic'
}

export const IssueTypeApi = {
  type: 'string',
  enum: Object.values(IssueType),
  example: IssueType.TASK
} as const;