import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({
    description: 'Name of the project',
    example: 'Updated Project Name'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique key for the project',
    example: 'UPDATED'
  })
  key?: string;

  @ApiPropertyOptional({
    description: 'Description of the project',
    example: 'Updated project description'
  })
  description?: string;

//   @ApiPropertyOptional({
//     description: 'Available issue types for the project',
//     enum: IssueType,
//     isArray: true,
//     example: [IssueType.TASK, IssueType.BUG]
//   })
//   issueTypes?: IssueType[];
}