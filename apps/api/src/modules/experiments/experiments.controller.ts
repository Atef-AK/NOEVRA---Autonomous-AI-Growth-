import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExperimentsService } from './experiments.service';
import {
  CreateExperimentDto,
  RecordVariantMetricDto,
  RecordTouchpointDto,
} from './dto/experiments.dto';

@ApiTags('experiments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/experiments', version: '1' })
export class ExperimentsController {
  constructor(private readonly service: ExperimentsService) {}

  // ==========================================
  // ATTRIBUTION ENDPOINTS (declared first)
  // ==========================================

  @Get('attribution/summary')
  @ApiOperation({ summary: 'Get multi-touch attribution revenue and touchpoint breakdowns' })
  async getAttributionSummary(
    @Param('orgId') orgId: string,
    @Query('model') model?: string,
  ) {
    const validModel =
      model === 'first_touch' || model === 'last_touch' || model === 'u_shaped'
        ? model
        : 'linear';
    const summary = await this.service.getAttributionSummary(orgId, validModel);
    return { success: true, data: summary };
  }

  @Post('attribution/touch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a customer touchpoint for attribution analysis' })
  async recordTouchpoint(
    @Param('orgId') orgId: string,
    @Body() dto: RecordTouchpointDto,
  ) {
    const touch = await this.service.recordTouchpoint(orgId, dto);
    return { success: true, data: touch };
  }

  // ==========================================
  // EXPERIMENTS A/B TESTING
  // ==========================================

  @Get()
  @ApiOperation({ summary: 'List growth experiments and statistical metrics' })
  async listExperiments(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
  ) {
    const experiments = await this.service.listExperiments(
      orgId,
      status || undefined,
    );
    return { success: true, data: experiments };
  }

  @Post()
  @ApiOperation({ summary: 'Create and launch a new growth A/B experiment' })
  async createExperiment(
    @Param('orgId') orgId: string,
    @Body() dto: CreateExperimentDto,
  ) {
    const experiment = await this.service.createExperiment(orgId, dto);
    return { success: true, data: experiment };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experiment details and statistical significance analysis' })
  async getExperiment(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const experiment = await this.service.getExperiment(orgId, id);
    return { success: true, data: experiment };
  }

  @Post(':id/metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record impressions and conversions for a test variant' })
  async recordMetrics(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: RecordVariantMetricDto,
  ) {
    const experiment = await this.service.recordVariantMetrics(orgId, id, dto);
    return { success: true, data: experiment };
  }
}
