import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { IssueType } from '../enums/issue-type.enum';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsEnum(IssueType, { each: true })
  @IsOptional()
  issueTypes?: IssueType[];
}