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
import { MembersService } from './members.service';
import { InviteMemberDto, UpdateMemberRoleDto, AcceptInviteDto } from './dto/member.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('members')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/members', version: '1' })
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'List organization members' })
  async list(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    const members = await this.service.list(orgId, user.id);
    return { success: true, data: members };
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a user to the organization' })
  async invite(
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.service.invite(orgId, dto, user.id);
    return { success: true, data: result };
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation' })
  async accept(@Body() dto: AcceptInviteDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.service.acceptInvite(dto.token, user.id);
    return { success: true, data: result };
  }

  @Patch(':memberId/role')
  @ApiOperation({ summary: 'Update member role (admin/owner only)' })
  async updateRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.service.updateRole(orgId, memberId, dto, user.id);
    return { success: true, data: result };
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  async remove(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.service.remove(orgId, memberId, user.id);
    return { success: true };
  }
}
