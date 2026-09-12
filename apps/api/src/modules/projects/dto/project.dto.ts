import { IsString, MinLength, MaxLength, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PROJECT_STATUS, type ProjectStatus } from '@growthos/shared';

export class CreateProjectDto {
  @ApiProperty({ example: 'My SaaS Product' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'https://myproduct.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'B2B SaaS tool for project management' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: Object.values(PROJECT_STATUS) })
  @IsOptional()
  @IsEnum(Object.values(PROJECT_STATUS) as ProjectStatus[])
  status?: ProjectStatus;
}
