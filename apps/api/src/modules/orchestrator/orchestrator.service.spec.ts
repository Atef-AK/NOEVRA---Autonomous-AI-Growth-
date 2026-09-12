import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      departmentCycle: {
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      autonomousSchedule: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      companyBrain: {
        findFirst: vi.fn().mockResolvedValue({
          brandVoice: 'direct, technical, authoritative',
        }),
      },
      project: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'proj-1',
          autonomyLevel: 2,
          status: 'active',
          timezone: 'UTC',
        }),
        update: vi.fn(),
      },
    };

    service = new OrchestratorService(mockPrisma);
  });

  it('triggers an autonomous growth department cycle with multi-agent actions', async () => {
    mockPrisma.departmentCycle.count.mockResolvedValue(5);
    mockPrisma.departmentCycle.create.mockImplementation(({ data }: any) => ({
      id: 'cycle-6',
      ...data,
    }));

    const result = await service.triggerCycle('org-1', { focusArea: 'all' });

    expect(result.id).toBe('cycle-6');
    expect(result.cycleNumber).toBe(6);
    expect(result.actionsDispatched).toBe(4);
    expect(result.status).toBe('completed');
    expect(mockPrisma.departmentCycle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          cycleNumber: 6,
          actionsDispatched: 4,
        }),
      }),
    );
  });

  it('seeds default cron daemon schedules if none exist', async () => {
    mockPrisma.autonomousSchedule.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'sch-1', name: 'Morning Social Distribution' },
        { id: 'sch-2', name: 'Weekly Deep Technical SEO Crawler' },
      ]);

    const schedules = await service.listSchedules('org-1');

    expect(mockPrisma.autonomousSchedule.create).toHaveBeenCalled();
    expect(schedules.length).toBe(2);
  });

  it('updates autonomy level and operating pause controls', async () => {
    mockPrisma.project.update.mockResolvedValue({
      autonomyLevel: 3,
      status: 'paused',
    });

    const result = await service.updateSettings('org-1', {
      autonomyLevel: 3,
      isPaused: true,
    });

    expect(result.autonomyLevel).toBe(3);
    expect(result.isPaused).toBe(true);
    expect(mockPrisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'proj-1' },
        data: expect.objectContaining({
          autonomyLevel: 3,
          status: 'paused',
        }),
      }),
    );
  });
});
