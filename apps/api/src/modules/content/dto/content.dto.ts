import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CreateContentItemDto {
  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  missionId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsIn(['blog_post', 'tweet_thread', 'linkedin_post', 'newsletter', 'changelog'])
  @IsOptional()
  type?: string;

  @IsString()
  @IsIn(['idea', 'brief', 'drafting', 'review', 'scheduled', 'published'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  tldr?: string;

  @IsString()
  @IsOptional()
  targetKeyword?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class UpdateContentItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsIn(['idea', 'brief', 'drafting', 'review', 'scheduled', 'published'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  tldr?: string;

  @IsString()
  @IsOptional()
  targetKeyword?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class GenerateContentDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsString()
  @IsIn(['blog_post', 'tweet_thread', 'linkedin_post', 'newsletter', 'changelog'])
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  targetKeyword?: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  campaignId?: string;

  @IsString()
  @IsOptional()
  missionId?: string;
}

export class RepurposeContentDto {
  @IsString()
  @IsIn(['tweet_thread', 'linkedin_post', 'newsletter', 'changelog'])
  @IsNotEmpty()
  targetType!: string;
}
