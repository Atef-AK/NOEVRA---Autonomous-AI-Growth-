import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, TriggerAgentRunDto } from './dto/agent.dto';

@ApiTags('agents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId', version: '1' })
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  @Get('agents')
  @ApiOperation({ summary: 'List all agents for organization' })
  async list(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    const agents = await this.service.list(orgId, user.id);
    return { success: true, data: agents };
  }

  @Post('agents')
  @ApiOperation({ summary: 'Create an autonomous agent' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateAgentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const agent = await this.service.create(orgId, dto, user.id);
    return { success: true, data: agent };
  }

  @Get('agents/:agentId')
  @ApiOperation({ summary: 'Get agent details by ID' })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const agent = await this.service.findById(agentId, orgId, user.id);
    return { success: true, data: agent };
  }

  @Patch('agents/:agentId')
  @ApiOperation({ summary: 'Update agent configuration' })
  async update(
    @Param('orgId') orgId: string,
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const agent = await this.service.update(agentId, orgId, dto, user.id);
    return { success: true, data: agent };
  }

  @Delete('agents/:agentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete agent' })
  async delete(
    @Param('orgId') orgId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.service.delete(agentId, orgId, user.id);
    return { success: true, data: result };
  }

  @Post('agents/:agentId/runs')
  @ApiOperation({ summary: 'Trigger an agent execution run' })
  async triggerRun(
    @Param('orgId') orgId: string,
    @Param('agentId') agentId: string,
    @Body() dto: TriggerAgentRunDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const run = await this.service.triggerRun(agentId, orgId, dto, user.id);
    return { success: true, data: run };
  }

  @Get('agents/:agentId/runs')
  @ApiOperation({ summary: 'List execution runs for an agent' })
  async listRuns(
    @Param('orgId') orgId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const runs = await this.service.listRuns(agentId, orgId, user.id);
    return { success: true, data: runs };
  }

  @Get('runs/:runId')
  @ApiOperation({ summary: 'Get details and step trace for an agent run' })
  async getRunDetails(
    @Param('orgId') orgId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const run = await this.service.getRunDetails(runId, orgId, user.id);
    return { success: true, data: run };
  }
}
