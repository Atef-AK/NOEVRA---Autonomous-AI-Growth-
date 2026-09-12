import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@ApiTags('organizations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations', version: '1' })
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations the current user belongs to' })
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    const orgs = await this.service.findAllForUser(user.id);
    return { success: true, data: orgs };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: AuthenticatedUser) {
    const org = await this.service.create(dto, user.id);
    return { success: true, data: org };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const org = await this.service.findById(id, user.id);
    return { success: true, data: org };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization (admin/owner only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const org = await this.service.update(id, dto, user.id);
    return { success: true, data: org };
  }
}
