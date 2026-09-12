import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConnectorsService } from './connectors.service';
import {
  ConnectAccountDto,
  CreateSocialPostDto,
} from './dto/connectors.dto';

@ApiTags('connectors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'organizations/:orgId/connectors', version: '1' })
export class ConnectorsController {
  constructor(private readonly service: ConnectorsService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List connected distribution channels' })
  async listAccounts(@Param('orgId') orgId: string) {
    const accounts = await this.service.listAccounts(orgId);
    return { success: true, data: accounts };
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Connect distribution channel with AES-256 encrypted credentials' })
  async connectAccount(
    @Param('orgId') orgId: string,
    @Body() dto: ConnectAccountDto,
  ) {
    const account = await this.service.connectAccount(orgId, dto);
    return { success: true, data: account };
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Disconnect channel' })
  async removeAccount(@Param('orgId') orgId: string, @Param('id') id: string) {
    const result = await this.service.removeAccount(orgId, id);
    return { success: true, data: result };
  }

  @Get('posts')
  @ApiOperation({ summary: 'List social publishing queue' })
  async listPosts(
    @Param('orgId') orgId: string,
    @Query('status') status?: string,
  ) {
    const posts = await this.service.listPosts(orgId, status);
    return { success: true, data: posts };
  }

  @Post('posts')
  @ApiOperation({ summary: 'Queue a social post for autonomous publishing' })
  async createSocialPost(
    @Param('orgId') orgId: string,
    @Body() dto: CreateSocialPostDto,
  ) {
    const post = await this.service.createSocialPost(orgId, dto);
    return { success: true, data: post };
  }

  @Post('posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Immediately dispatch and publish post to external channel' })
  async publishPost(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    const result = await this.service.publishPost(orgId, id);
    return { success: true, data: result };
  }
}
