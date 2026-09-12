import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { BrainService } from './brain.service';
import { CrawlUrlDto, UpdateBrainDto, QueryBrainDto } from './dto/brain.dto';

@ApiTags('brain')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/brain', version: '1' })
export class BrainController {
  constructor(private readonly service: BrainService) {}

  @Get()
  @ApiOperation({ summary: 'Get Company Brain profile and brand guidelines' })
  async getBrain(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    const brain = await this.service.getBrain(orgId, user.id);
    return { success: true, data: brain };
  }

  @Patch()
  @ApiOperation({ summary: 'Update Company Brain brand voice and value propositions' })
  async updateBrain(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateBrainDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const brain = await this.service.updateBrain(orgId, dto, user.id);
    return { success: true, data: brain };
  }

  @Post('crawl')
  @ApiOperation({ summary: 'Crawl URL, extract knowledge, chunk, embed, and store in vector memory' })
  async crawlUrl(
    @Param('orgId') orgId: string,
    @Body() dto: CrawlUrlDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.service.crawlAndIngestUrl(orgId, dto, user.id);
    return { success: true, data: result };
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic vector similarity query over company knowledge' })
  async semanticQuery(
    @Param('orgId') orgId: string,
    @Body() dto: QueryBrainDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const matches = await this.service.semanticSearch(orgId, dto, user.id);
    return { success: true, data: matches };
  }

  @Get('sources')
  @ApiOperation({ summary: 'List knowledge sources ingested into Company Brain' })
  async listSources(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    const sources = await this.service.listSources(orgId, user.id);
    return { success: true, data: sources };
  }
}
