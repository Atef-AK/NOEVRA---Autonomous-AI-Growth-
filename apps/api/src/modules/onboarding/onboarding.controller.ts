/**
 * OnboardingController — Website analysis + SSE streaming endpoint.
 *
 * POST /api/v1/organizations/:orgId/onboarding/analyze
 *   → Runs the website analysis pipeline synchronously (small sites)
 *
 * GET /api/v1/organizations/:orgId/onboarding/stream?url=...
 *   → SSE endpoint that streams real-time analysis progress events
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OnboardingService, type OnboardingProgress } from './onboarding.service';
import { IsUrl, IsString, IsOptional } from 'class-validator';

export class AnalyzeWebsiteDto {
  @IsUrl()
  websiteUrl!: string;

  @IsString()
  @IsOptional()
  projectName?: string;
}

@ApiTags('onboarding')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/onboarding', version: '1' })
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly service: OnboardingService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze a website and bootstrap the GrowthOS pipeline' })
  async analyzeWebsite(
    @Param('orgId') orgId: string,
    @Body() dto: AnalyzeWebsiteDto,
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    if (!dto.websiteUrl) {
      throw new BadRequestException('websiteUrl is required');
    }

    const progress: OnboardingProgress[] = [];

    const result = await this.service.analyzeWebsite(
      orgId,
      dto.websiteUrl,
      (p) => progress.push(p),
    );

    return {
      success: result.success,
      data: result.summary,
      progressLog: progress,
    };
  }

  @Get('stream')
  @ApiOperation({ summary: 'SSE stream for real-time onboarding progress' })
  async streamAnalysis(
    @Param('orgId') orgId: string,
    @Query('url') url: string,
    @CurrentUser() _user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    if (!url) {
      throw new BadRequestException('url query parameter is required');
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (data: OnboardingProgress) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send heartbeat
    send({
      step: 0,
      totalSteps: 9,
      stage: 'starting',
      agent: 'Growth Director (Orchestrator)',
      message: 'GrowthOS autonomous swarm initializing...',
      completed: false,
    });

    try {
      const result = await this.service.analyzeWebsite(orgId, url, send);

      // Send final event
      res.write(`data: ${JSON.stringify({ type: 'done', ...result.summary })}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error({ err, orgId, url }, 'Onboarding SSE stream error');
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
