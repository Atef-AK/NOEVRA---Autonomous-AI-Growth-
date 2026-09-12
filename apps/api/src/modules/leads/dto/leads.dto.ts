import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsIn(['new', 'enriching', 'qualified', 'outreach', 'converted', 'disqualified'])
  @IsOptional()
  stage?: string;

  @IsString()
  @IsIn(['community', 'scraping', 'inbound', 'intent'])
  @IsOptional()
  source?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @IsString()
  @IsOptional()
  twitterUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsIn(['new', 'enriching', 'qualified', 'outreach', 'converted', 'disqualified'])
  @IsOptional()
  stage?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ScanCommunityDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  platforms?: string[];
}

export class DraftReplyDto {
  @IsString()
  @IsOptional()
  intentDirective?: string;
}
