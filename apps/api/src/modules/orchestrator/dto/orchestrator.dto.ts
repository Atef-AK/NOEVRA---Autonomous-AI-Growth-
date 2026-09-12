import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class TriggerCycleDto {
  @IsString()
  @IsOptional()
  focusArea?: string; // e.g. "seo", "content", "leads", "all"
}

export class UpdateOrchestratorSettingsDto {
  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  autonomyLevel?: number;

  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;
}

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  cronExpression!: string;

  @IsString()
  @IsNotEmpty()
  agentRole!: string;
}
