import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsArray,
  IsInt,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrawlUrlDto {
  @ApiProperty({ example: 'https://growthos.ai' })
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'cuid_project_id' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class UpdateBrainDto {
  @ApiPropertyOptional({ example: 'GrowthOS is an autonomous AI growth operating system.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  summary?: string;

  @ApiPropertyOptional({ example: 'Authoritative, analytical, bold, data-driven.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  brandVoice?: string;

  @ApiPropertyOptional({ example: 'B2B SaaS founders, VP of Growth, marketing leaders.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  targetAudience?: string;

  @ApiPropertyOptional({ example: ['Autonomous ReAct execution', 'Cross-provider fallback'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  valueProps?: string[];

  @ApiPropertyOptional({ example: ['Jasper', 'Copy.ai', 'HubSpot'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitors?: string[];

  @ApiPropertyOptional({ example: 'The category creator for autonomous AI growth departments.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  positioning?: string;
}

export class QueryBrainDto {
  @ApiProperty({ example: 'What are our primary value propositions for enterprise customers?' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  query!: string;

  @ApiPropertyOptional({ example: 'cuid_project_id' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ example: 0.2, default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(-1.0)
  @Max(1.0)
  minSimilarity?: number;
}
