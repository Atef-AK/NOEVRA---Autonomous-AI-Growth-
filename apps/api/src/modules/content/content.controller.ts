import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ContentService } from './content.service';
import {
  CreateCampaignDto,
  CreateContentItemDto,
  UpdateContentItemDto,
  GenerateContentDto,
  RepurposeContentDto,
} from './dto/content.dto';

@ApiTags('content')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/content', version: '1' })
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get('items')
  @ApiOperation({ summary: 'List editorial content items' })
  async listContent(
    @Param('orgId') orgId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string,
  ) {
    const items = await this.service.listContent(orgId, { type, status, campaignId });
    return { success: true, data: items };
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a content item manually' })
  async createContent(
    @Param('orgId') orgId: string,
    @Body() dto: CreateContentItemDto,
  ) {
    const item = await this.service.createContent(orgId, dto);
    return { success: true, data: item };
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get content item with full revision history' })
  async getContent(@Param('orgId') orgId: string, @Param('id') id: string) {
    const item = await this.service.getContent(orgId, id);
    return { success: true, data: item };
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update content item and track revisions' })
  async updateContent(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentItemDto,
  ) {
    const item = await this.service.updateContent(orgId, id, dto);
    return { success: true, data: item };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autonomously generate production-ready content grounded in Company Brain',
  })
  async generateContent(
    @Param('orgId') orgId: string,
    @Body() dto: GenerateContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const item = await this.service.generateContent(orgId, dto, user.id);
    return { success: true, data: item };
  }

  @Post('items/:id/repurpose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cross-format content repurposing (e.g. blog post to Twitter thread / LinkedIn post)',
  })
  async repurposeContent(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: RepurposeContentDto,
  ) {
    const item = await this.service.repurposeContent(orgId, id, dto);
    return { success: true, data: item };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List marketing campaigns' })
  async listCampaigns(@Param('orgId') orgId: string) {
    const campaigns = await this.service.listCampaigns(orgId);
    return { success: true, data: campaigns };
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a marketing campaign' })
  async createCampaign(
    @Param('orgId') orgId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const campaign = await this.service.createCampaign(orgId, dto);
    return { success: true, data: campaign };
  }
}
