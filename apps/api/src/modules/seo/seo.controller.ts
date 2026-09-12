import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SeoService } from './seo.service';
import { RunAuditDto, TrackKeywordDto } from './dto/seo.dto';

@ApiTags('seo')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/seo', version: '1' })
export class SeoController {
  constructor(private readonly service: SeoService) {}

  @Get('audits')
  @ApiOperation({ summary: 'List recent technical SEO audits' })
  async listAudits(@Param('orgId') orgId: string) {
    const audits = await this.service.listAudits(orgId);
    return { success: true, data: audits };
  }

  @Post('audits')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run automated technical SEO audit on target URL' })
  async runAudit(
    @Param('orgId') orgId: string,
    @Body() dto: RunAuditDto,
  ) {
    const audit = await this.service.runAudit(orgId, dto);
    return { success: true, data: audit };
  }

  @Get('audits/:id')
  @ApiOperation({ summary: 'Get SEO audit details and technical recommendations' })
  async getAudit(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const audit = await this.service.getAudit(orgId, id);
    return { success: true, data: audit };
  }

  @Get('keywords')
  @ApiOperation({ summary: 'List tracked SERP keywords and rank history' })
  async listKeywords(@Param('orgId') orgId: string) {
    const keywords = await this.service.listKeywords(orgId);
    return { success: true, data: keywords };
  }

  @Post('keywords')
  @ApiOperation({ summary: 'Add keyword to SERP rank tracker' })
  async trackKeyword(
    @Param('orgId') orgId: string,
    @Body() dto: TrackKeywordDto,
  ) {
    const keyword = await this.service.trackKeyword(orgId, dto);
    return { success: true, data: keyword };
  }
}
