import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectorsService } from './connectors.service';
import { PrismaService } from '../../common/database/prisma.service';
import { encrypt, serializeEncrypted } from '@growthos/shared';

describe('ConnectorsService', () => {
  let service: ConnectorsService;
  let mockPrisma: any;
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    mockPrisma = {
      connectorAccount: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      socialPost: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new ConnectorsService(mockPrisma as unknown as PrismaService);
  });

  it('encrypts credentials when connecting an account', async () => {
    mockPrisma.connectorAccount.upsert.mockImplementation((args: any) => ({
      id: 'acc-1',
      organizationId: args.create.organizationId,
      provider: args.create.provider,
      name: args.create.name,
      status: args.create.status,
      lastSyncAt: args.create.lastSyncAt,
      createdAt: new Date(),
    }));

    const result = await service.connectAccount('org-1', {
      provider: 'twitter',
      name: '@growthos_ai',
      credentials: { apiKey: 'key_123', apiSecret: 'secret_456' },
    });

    expect(result.id).toBe('acc-1');
    expect(result.provider).toBe('twitter');
    expect(mockPrisma.connectorAccount.upsert).toHaveBeenCalled();
    const upsertCall = mockPrisma.connectorAccount.upsert.mock.calls[0][0];
    expect(upsertCall.create.encryptedCredentials).toBeDefined();
    // Raw credentials must never be in plaintext
    expect(upsertCall.create.encryptedCredentials).not.toContain('key_123');
  });

  it('queues a social post for autonomous publishing', async () => {
    mockPrisma.connectorAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    mockPrisma.socialPost.create.mockImplementation((args: any) => ({
      id: 'post-1',
      ...args.data,
    }));

    const result = await service.createSocialPost('org-1', {
      connectorAccountId: 'acc-1',
      provider: 'twitter',
      text: 'Autonomous AI growth operating system is now open source!',
      thread: ['1/3 First tweet', '2/3 Second tweet'],
    });

    expect(result.id).toBe('post-1');
    expect(result.status).toBe('publishing');
    expect((result.payload as any)?.thread?.length).toBe(2);
    expect(mockPrisma.socialPost.create).toHaveBeenCalled();
  });

  it('publishes social post and generates external post URL', async () => {
    const encryptedCreds = serializeEncrypted(
      encrypt(JSON.stringify({ token: 'test_token' }), testKey),
    );

    mockPrisma.socialPost.findFirst.mockResolvedValue({
      id: 'post-1',
      organizationId: 'org-1',
      provider: 'twitter',
      connectorAccount: {
        id: 'acc-1',
        name: '@growthos_ai',
        encryptedCredentials: encryptedCreds,
      },
    });

    mockPrisma.socialPost.update.mockImplementation((args: any) => ({
      id: 'post-1',
      ...args.data,
    }));

    const result = await service.publishPost('org-1', 'post-1');

    expect(result.status).toBe('published');
    expect(result.externalPostUrl).toContain('x.com/growthos_ai/status/twitter_');
    expect(result.impressions).toBeGreaterThan(0);
    expect(mockPrisma.socialPost.update).toHaveBeenCalled();
  });

  it('removes connector account successfully', async () => {
    mockPrisma.connectorAccount.findFirst.mockResolvedValue({ id: 'acc-1' });
    mockPrisma.connectorAccount.delete.mockResolvedValue({});

    const result = await service.removeAccount('org-1', 'acc-1');
    expect(result.success).toBe(true);
    expect(mockPrisma.connectorAccount.delete).toHaveBeenCalledWith({ where: { id: 'acc-1' } });
  });
});
