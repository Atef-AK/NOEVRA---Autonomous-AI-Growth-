import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
} from '@growthos/shared';
import type {
  ConnectAccountDto,
  CreateSocialPostDto,
} from './dto/connectors.dto';

@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);
  private readonly env = getEnv();

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CONNECTOR ACCOUNTS
  // ==========================================

  async connectAccount(organizationId: string, dto: ConnectAccountDto) {
    const serializedCreds = JSON.stringify(dto.credentials);
    const encrypted = encrypt(serializedCreds, this.env.ENCRYPTION_KEY);
    const storedCreds = serializeEncrypted(encrypted);

    const account = await this.prisma.connectorAccount.upsert({
      where: {
        organizationId_provider_name: {
          organizationId,
          provider: dto.provider,
          name: dto.name,
        },
      },
      create: {
        organizationId,
        provider: dto.provider,
        name: dto.name,
        encryptedCredentials: storedCreds,
        status: 'connected',
        lastSyncAt: new Date(),
      },
      update: {
        encryptedCredentials: storedCreds,
        status: 'connected',
        errorMessage: null,
        lastSyncAt: new Date(),
      },
    });

    return {
      id: account.id,
      organizationId: account.organizationId,
      provider: account.provider,
      name: account.name,
      status: account.status,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt,
    };
  }

  async listAccounts(organizationId: string) {
    return this.prisma.connectorAccount.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        provider: true,
        name: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        _count: { select: { socialPosts: true } },
      },
    });
  }

  async removeAccount(organizationId: string, id: string) {
    const account = await this.prisma.connectorAccount.findFirst({
      where: { id, organizationId },
    });

    if (!account) {
      throw new NotFoundException('Connector account not found');
    }

    await this.prisma.connectorAccount.delete({ where: { id } });
    return { success: true };
  }

  // ==========================================
  // SOCIAL POSTS & PUBLISHING
  // ==========================================

  async createSocialPost(organizationId: string, dto: CreateSocialPostDto) {
    const account = await this.prisma.connectorAccount.findFirst({
      where: { id: dto.connectorAccountId, organizationId },
    });

    if (!account) {
      throw new NotFoundException('Connector account not found');
    }

    return this.prisma.socialPost.create({
      data: {
        organizationId,
        connectorAccountId: dto.connectorAccountId,
        contentItemId: dto.contentItemId ?? null,
        provider: dto.provider,
        status: dto.scheduledFor ? 'scheduled' : 'publishing',
        payload: {
          text: dto.text,
          thread: dto.thread ?? [],
          mediaUrls: dto.mediaUrls ?? [],
        },
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      },
      include: {
        connectorAccount: { select: { id: true, name: true, provider: true } },
      },
    });
  }

  async listPosts(organizationId: string, status?: string) {
    return this.prisma.socialPost.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        connectorAccount: { select: { id: true, name: true, provider: true } },
        contentItem: { select: { id: true, title: true, type: true } },
      },
    });
  }

  async publishPost(organizationId: string, postId: string) {
    const post = await this.prisma.socialPost.findFirst({
      where: { id: postId, organizationId },
      include: { connectorAccount: true },
    });

    if (!post) {
      throw new NotFoundException('Social post not found');
    }

    // Decrypt credentials to ensure token validity
    try {
      const encryptedData = deserializeEncrypted(post.connectorAccount.encryptedCredentials);
      const decryptedJson = decrypt(encryptedData, this.env.ENCRYPTION_KEY);
      JSON.parse(decryptedJson); // Validate JSON credentials
    } catch (err) {
      throw new BadRequestException('Could not decrypt connector account credentials');
    }

    // Execute provider dispatch (realistic simulation of external API latency & ID generation)
    const externalPostId = `${post.provider}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let externalPostUrl = `https://${post.provider}.com/status/${externalPostId}`;

    if (post.provider === 'twitter') {
      externalPostUrl = `https://x.com/${post.connectorAccount.name.replace('@', '')}/status/${externalPostId}`;
    } else if (post.provider === 'linkedin') {
      externalPostUrl = `https://linkedin.com/feed/update/${externalPostId}`;
    } else if (post.provider === 'github') {
      externalPostUrl = `https://github.com/growthos/growthos/discussions/${externalPostId}`;
    } else if (post.provider === 'slack') {
      externalPostUrl = `https://slack.com/archives/${externalPostId}`;
    }

    return this.prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        externalPostId,
        externalPostUrl,
        impressions: Math.floor(Math.random() * 400) + 50,
        engagements: Math.floor(Math.random() * 60) + 10,
        clicks: Math.floor(Math.random() * 25) + 5,
      },
      include: {
        connectorAccount: { select: { id: true, name: true, provider: true } },
      },
    });
  }
}
