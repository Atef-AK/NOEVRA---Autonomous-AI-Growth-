import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  IsDateString,
  IsObject,
} from 'class-validator';

export class ConnectAccountDto {
  @IsString()
  @IsIn(['twitter', 'linkedin', 'github', 'slack', 'webhook'])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  credentials!: Record<string, string>;
}

export class CreateSocialPostDto {
  @IsString()
  @IsNotEmpty()
  connectorAccountId!: string;

  @IsString()
  @IsOptional()
  contentItemId?: string;

  @IsString()
  @IsIn(['twitter', 'linkedin', 'github', 'slack', 'webhook'])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsArray()
  @IsOptional()
  thread?: string[];

  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
