import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { IssueType } from '../enums/issue-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Name of the project',
    example: 'Marketing Website'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Unique key for the project (uppercase, no spaces)',
    example: 'MWEB'
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
    example: 'Development of new marketing website'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Available issue types for the project',
    enum: IssueType,
    isArray: true,
    example: [IssueType.TASK, IssueType.BUG, IssueType.STORY]
  })
  @IsArray()
  @IsEnum(IssueType, { each: true })
  @IsOptional()
  issueTypes?: IssueType[];
}