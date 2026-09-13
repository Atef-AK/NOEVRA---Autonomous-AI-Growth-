import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 'SEO Research Agent' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Researches keywords and competitor strategies' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'You are an autonomous SEO research agent with access to web search tools.' })
  @IsString()
  @MinLength(10)
  systemPrompt!: string;

  @ApiPropertyOptional({ example: 'google/gemini-2.5-flash', default: 'google/gemini-2.5-flash' })
  @IsOptional()
  @IsString()
  preferredModel?: string;

  @ApiPropertyOptional({ example: ['web_search', 'fetch_url', 'calculator'], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTools?: string[];

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxSteps?: number;

  @ApiPropertyOptional({ example: 4096, default: 4096 })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional({ example: 7, description: 'temperature * 10 (e.g. 7 = 0.7)', default: 7 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  temperatureX10?: number;
}

export class UpdateAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  systemPrompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preferredModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedTools?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxSteps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(128000)
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  temperatureX10?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TriggerAgentRunDto {
  @ApiProperty({ example: 'Analyze top 5 organic search competitors for AI CRM software' })
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  goal!: string;

  @ApiPropertyOptional({ example: 'cuid_project_id' })
  @IsOptional()
  @IsString()
  projectId?: string;
}
