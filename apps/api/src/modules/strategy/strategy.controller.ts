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
import { StrategyService } from './strategy.service';
import {
  CreateGoalDto,
  DecomposeGoalDto,
  CreateMissionDto,
  UpdateMissionDto,
  CreateTaskDto,
  CreateOpportunityDto,
} from './dto/strategy.dto';

@ApiTags('strategy')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/strategy', version: '1' })
export class StrategyController {
  constructor(private readonly service: StrategyService) {}

  // ==========================================
  // GOALS
  // ==========================================

  @Get('goals')
  @ApiOperation({ summary: 'List strategic growth goals' })
  async listGoals(@Param('orgId') orgId: string) {
    const goals = await this.service.listGoals(orgId);
    return { success: true, data: goals };
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create a strategic growth goal' })
  async createGoal(@Param('orgId') orgId: string, @Body() dto: CreateGoalDto) {
    const goal = await this.service.createGoal(orgId, dto);
    return { success: true, data: goal };
  }

  @Get('goals/:goalId')
  @ApiOperation({ summary: 'Get growth goal with missions and tasks' })
  async getGoal(@Param('orgId') orgId: string, @Param('goalId') goalId: string) {
    const goal = await this.service.getGoal(orgId, goalId);
    return { success: true, data: goal };
  }

  @Post('goals/:goalId/decompose')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autonomously decompose high-level goal into strategic missions and tactical tasks',
  })
  async decomposeGoal(
    @Param('orgId') orgId: string,
    @Param('goalId') goalId: string,
    @Body() dto: DecomposeGoalDto,
  ) {
    const result = await this.service.decomposeGoal(orgId, goalId, dto);
    return { success: true, data: result };
  }

  // ==========================================
  // MISSIONS
  // ==========================================

  @Get('missions')
  @ApiOperation({ summary: 'List missions' })
  async listMissions(
    @Param('orgId') orgId: string,
    @Query('goalId') goalId?: string,
  ) {
    const missions = await this.service.listMissions(orgId, goalId);
    return { success: true, data: missions };
  }

  @Post('missions')
  @ApiOperation({ summary: 'Create a strategic mission' })
  async createMission(
    @Param('orgId') orgId: string,
    @Body() dto: CreateMissionDto,
  ) {
    const mission = await this.service.createMission(orgId, dto);
    return { success: true, data: mission };
  }

  @Patch('missions/:missionId')
  @ApiOperation({ summary: 'Update mission status or progress' })
  async updateMission(
    @Param('orgId') orgId: string,
    @Param('missionId') missionId: string,
    @Body() dto: UpdateMissionDto,
  ) {
    const mission = await this.service.updateMission(orgId, missionId, dto);
    return { success: true, data: mission };
  }

  // ==========================================
  // TASKS
  // ==========================================

  @Get('tasks')
  @ApiOperation({ summary: 'List tactical tasks' })
  async listTasks(
    @Param('orgId') orgId: string,
    @Query('missionId') missionId?: string,
  ) {
    const tasks = await this.service.listTasks(orgId, missionId);
    return { success: true, data: tasks };
  }

  @Post('tasks')
  @ApiOperation({ summary: 'Create a tactical task' })
  async createTask(@Param('orgId') orgId: string, @Body() dto: CreateTaskDto) {
    const task = await this.service.createTask(orgId, dto);
    return { success: true, data: task };
  }

  @Post('tasks/:taskId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute tactical task with assigned AI agent' })
  async executeTask(
    @Param('orgId') orgId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const task = await this.service.executeTask(orgId, taskId, user.id);
    return { success: true, data: task };
  }

  // ==========================================
  // OPPORTUNITIES
  // ==========================================

  @Get('opportunities')
  @ApiOperation({ summary: 'List growth opportunities ranked by RICE score' })
  async listOpportunities(@Param('orgId') orgId: string) {
    const opportunities = await this.service.listOpportunities(orgId);
    return { success: true, data: opportunities };
  }

  @Post('opportunities')
  @ApiOperation({ summary: 'Create growth opportunity with RICE and ICE scores' })
  async createOpportunity(
    @Param('orgId') orgId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    const opp = await this.service.createOpportunity(orgId, dto);
    return { success: true, data: opp };
  }

  @Post('opportunities/:oppId/convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert opportunity into an active Growth Mission' })
  async convertOpportunity(
    @Param('orgId') orgId: string,
    @Param('oppId') oppId: string,
  ) {
    const mission = await this.service.convertOpportunityToMission(orgId, oppId);
    return { success: true, data: mission };
  }
}
