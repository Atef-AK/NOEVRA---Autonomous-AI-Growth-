import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class CreateExperimentVariantDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  trafficShare!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  impressions?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  conversions?: number;
}

export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  hypothesis!: string;

  @IsString()
  @IsNotEmpty()
  metricName!: string;

  @IsArray()
  variants!: CreateExperimentVariantDto[];
}

export class RecordVariantMetricDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsNumber()
  @Min(0)
  impressions!: number;

  @IsNumber()
  @Min(0)
  conversions!: number;
}

export class RecordTouchpointDto {
  @IsString()
  @IsNotEmpty()
  visitorId!: string;

  @IsString()
  @IsIn(['organic_search', 'twitter', 'linkedin', 'referral', 'direct'])
  channel!: string;

  @IsString()
  @IsOptional()
  campaignName?: string;

  @IsString()
  @IsIn(['first_touch', 'lead_creation', 'opportunity', 'deal_closed'])
  touchpointType!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  revenueImpact?: number;
}
