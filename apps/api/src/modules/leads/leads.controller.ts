import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ScanCommunityDto,
  DraftReplyDto,
} from './dto/leads.dto';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/leads', version: '1' })
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  // ==========================================
  // COMMUNITY INTERACTIONS (declared first)
  // ==========================================

  @Get('community')
  @ApiOperation({ summary: 'List discovered social conversations with buying intent' })
  async listCommunity(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
  ) {
    const interactions = await this.service.listCommunityInteractions(
      orgId,
      status || undefined,
    );
    return { success: true, data: interactions };
  }

  @Post('community/scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan Reddit, HackerNews, and X for prospective leads' })
  async scanCommunity(
    @Param('orgId') orgId: string,
    @Body() dto: ScanCommunityDto,
  ) {
    const results = await this.service.scanCommunity(orgId, dto);
    return { success: true, data: results };
  }

  @Post('community/:id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Draft AI brand-aligned community reply' })
  async draftReply(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: DraftReplyDto,
  ) {
    const updated = await this.service.draftReply(orgId, id, dto);
    return { success: true, data: updated };
  }

  @Patch('community/:id/status')
  @ApiOperation({ summary: 'Update status of community interaction' })
  async updateCommunityStatus(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const updated = await this.service.updateInteractionStatus(orgId, id, status);
    return { success: true, data: updated };
  }

  // ==========================================
  // LEADS CRUD & ENRICHMENT
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'List leads with optional stage filter' })
  async listLeads(
    @Param('orgId') orgId: string,
    @Query('stage') stage?: string,
    @Query('minScore') minScore?: string,
  ) {
    const leads = await this.service.listLeads(orgId, {
      stage: stage || undefined,
      minScore: minScore ? parseInt(minScore, 10) : undefined,
    });
    return { success: true, data: leads };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prospect lead' })
  async createLead(
    @Param('orgId') orgId: string,
    @Body() dto: CreateLeadDto,
  ) {
    const lead = await this.service.createLead(orgId, dto);
    return { success: true, data: lead };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details and enrichment data' })
  async getLead(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const lead = await this.service.getLead(orgId, id);
    return { success: true, data: lead };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead attributes or pipeline stage' })
  async updateLead(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    const lead = await this.service.updateLead(orgId, id, dto);
    return { success: true, data: lead };
  }

  @Post(':id/enrich')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enrich lead with technographic signals and recompute ICP score' })
  async enrichLead(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const lead = await this.service.enrichLead(orgId, id);
    return { success: true, data: lead };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  async deleteLead(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const res = await this.service.deleteLead(orgId, id);
    return { success: true, data: res };
  }
}
