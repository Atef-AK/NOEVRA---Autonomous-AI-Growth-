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
import { OrchestratorService } from './orchestrator.service';
import {
  TriggerCycleDto,
  UpdateOrchestratorSettingsDto,
  CreateScheduleDto,
} from './dto/orchestrator.dto';

@ApiTags('orchestrator')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/orchestrator', version: '1' })
export class OrchestratorController {
  constructor(private readonly service: OrchestratorService) {}

  // ==========================================
  // AUTONOMOUS CYCLES
  // ==========================================

  @Get('cycles')
  @ApiOperation({ summary: 'List recent autonomous growth department execution cycles' })
  async listCycles(@Param('orgId') orgId: string) {
    const cycles = await this.service.listCycles(orgId);
    return { success: true, data: cycles };
  }

  @Post('cycles/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger an autonomous growth department loop' })
  async triggerCycle(
    @Param('orgId') orgId: string,
    @Body() dto: TriggerCycleDto,
  ) {
    const cycle = await this.service.triggerCycle(orgId, dto);
    return { success: true, data: cycle };
  }

  // ==========================================
  // SCHEDULES
  // ==========================================

  @Get('schedules')
  @ApiOperation({ summary: 'List autonomous agent cron daemon schedules' })
  async listSchedules(@Param('orgId') orgId: string) {
    const schedules = await this.service.listSchedules(orgId);
    return { success: true, data: schedules };
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Create a new autonomous agent schedule' })
  async createSchedule(
    @Param('orgId') orgId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    const schedule = await this.service.createSchedule(orgId, dto);
    return { success: true, data: schedule };
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Toggle schedule active state' })
  async toggleSchedule(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const schedule = await this.service.toggleSchedule(orgId, id, isActive);
    return { success: true, data: schedule };
  }

  // ==========================================
  // OPERATING CONTROLS
  // ==========================================

  @Get('settings')
  @ApiOperation({ summary: 'Get autonomous operation controls & autonomy level' })
  async getSettings(@Param('orgId') orgId: string) {
    const settings = await this.service.getSettings(orgId);
    return { success: true, data: settings };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update autonomy level (1-3) and pause switch' })
  async updateSettings(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrchestratorSettingsDto,
  ) {
    const settings = await this.service.updateSettings(orgId, dto);
    return { success: true, data: settings };
  }
}
