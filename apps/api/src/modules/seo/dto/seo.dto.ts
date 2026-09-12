import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class RunAuditDto {
  @IsString()
  @IsUrl({ require_tld: false })
  targetUrl!: string;
}

export class TrackKeywordDto {
  @IsString()
  @IsNotEmpty()
  keyword!: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  targetRank?: number;

  @IsString()
  @IsIn(['navigational', 'informational', 'commercial', 'transactional'])
  @IsOptional()
  intent?: string;
}
