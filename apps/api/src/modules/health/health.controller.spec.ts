import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller';
import type { PrismaService } from '../../common/database/prisma.service';

describe('HealthController', () => {
  it('returns ok status when database responds', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('returns degraded status when database fails', async () => {
    const mockPrisma = {
      $queryRaw: vi.fn().mockRejectedValueOnce(new Error('DB connection lost')),
    } as unknown as PrismaService;

    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.services.database).toBe('error');
  });
});
