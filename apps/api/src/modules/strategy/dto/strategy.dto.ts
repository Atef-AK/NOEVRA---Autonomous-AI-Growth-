import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  metricName!: string;

  @IsNumber()
  targetValue!: number;

  @IsNumber()
  @IsOptional()
  currentValue?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  strategyNotes?: string;
}

export class DecomposeGoalDto {
  @IsString()
  @IsOptional()
  prompt?: string;

  @IsNumber()
  @IsOptional()
  targetMissionsCount?: number;
}

export class CreateMissionDto {
  @IsString()
  @IsOptional()
  goalId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  objective!: string;

  @IsString()
  @IsOptional()
  estimatedImpact?: string;

  @IsString()
  @IsOptional()
  ownerAgentRole?: string;

  @IsString()
  @IsOptional()
  deadline?: string;
}

export class UpdateMissionDto {
  @IsString()
  @IsIn(['planned', 'in_progress', 'review', 'completed', 'failed'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  estimatedImpact?: string;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  missionId!: string;

  @IsString()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @IsArray()
  @IsOptional()
  dependencies?: string[];
}

export class CreateOpportunityDto {
  @IsString()
  @IsOptional()
  goalId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['seo', 'content', 'social', 'conversion', 'outreach'])
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  reach!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  impact!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  confidence!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  effort!: number;
}
