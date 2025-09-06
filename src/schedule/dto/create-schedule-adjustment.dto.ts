import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { AdjustmentType } from '../schedule-adjustment.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleAdjustmentDto {
  @ApiProperty({
    description: 'Type of adjustment being requested',
    enum: AdjustmentType,
    example: AdjustmentType.REASSIGNMENT
  })
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @ApiProperty({
    description: 'ID of the task being adjusted',
    example: 'aa28e178-00b7-4d67-bc33-614de6b7a254'
  })
  @IsUUID()
  taskId: string;

  @ApiPropertyOptional({
    description: 'ID of the new assignee (for reassignments)',
    example: '52b1e09f-7f97-4eaa-9df2-94f9f240b7e5'
  })
  @IsUUID()
  @IsOptional()
  @ValidateIf(o => o.type === AdjustmentType.REASSIGNMENT)
  newAssigneeId?: string;

  @ApiPropertyOptional({
    description: 'New deadline for the task (ISO format)',
    example: '2025-09-25'
  })
  @IsOptional()
  @ValidateIf(o => o.type === AdjustmentType.DEADLINE_CHANGE)
  newDeadline?: Date;

  @ApiPropertyOptional({
    description: 'New priority for the task',
    example: 'high'
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => o.type === AdjustmentType.PRIORITY_CHANGE)
  newPriority?: string;

  @ApiPropertyOptional({
    description: 'New status for the task',
    example: 'in-progress'
  })
  @IsString()
  @IsOptional()
  @ValidateIf(o => o.type === AdjustmentType.STATUS_CHANGE)
  newStatus?: string;

  @ApiProperty({
    description: 'Reason for the adjustment',
    example: 'Team member is overloaded with high-priority tasks'
  })
  @IsString()
  reason: string;
}