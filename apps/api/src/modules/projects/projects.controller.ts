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
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/projects', version: '1' })
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects in organization' })
  async list(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    const projects = await this.service.list(orgId, user.id);
    return { success: true, data: projects };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.service.create(orgId, dto, user.id);
    return { success: true, data: project };
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.service.findById(projectId, orgId, user.id);
    return { success: true, data: project };
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.service.update(projectId, orgId, dto, user.id);
    return { success: true, data: project };
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive project (owner/admin only)' })
  async archive(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.service.archive(projectId, orgId, user.id);
    return { success: true, message: 'Project archived' };
  }
}
