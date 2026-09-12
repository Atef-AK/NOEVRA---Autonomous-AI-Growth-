import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExperimentsService } from './experiments.service';

describe('ExperimentsService', () => {
  let service: ExperimentsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      growthExperiment: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      attributionTouch: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };

    service = new ExperimentsService(mockPrisma);
  });

  it('calculates statistical significance accurately using two-proportion z-score test', () => {
    // Control: 50 / 1000 = 5.0%
    // Challenger: 95 / 1000 = 9.5%
    const control = { impressions: 1000, conversions: 50 };
    const challenger = { impressions: 1000, conversions: 95 };

    const result = service.calculateSignificance(control, challenger);

    expect(result.zScore).toBeGreaterThan(3.0);
    expect(result.confidence).toBeGreaterThanOrEqual(99.0);
    expect(result.isSignificant).toBe(true);
  });

  it('declares no significance when sample size is insufficient or difference is negligible', () => {
    const control = { impressions: 100, conversions: 5 };
    const challenger = { impressions: 100, conversions: 6 };

    const result = service.calculateSignificance(control, challenger);

    expect(result.isSignificant).toBe(false);
  });

  it('creates an experiment and calculates initial significance', async () => {
    const mockCreated = {
      id: 'exp-1',
      organizationId: 'org-1',
      title: 'Homepage Headline Test',
      hypothesis: 'Focusing on Autonomous AI Department will double signups',
      metricName: 'Signup Rate',
      status: 'running',
      variants: [
        { id: 'A', name: 'Control', trafficShare: 50, impressions: 500, conversions: 25, conversionRate: 5.0 },
        { id: 'B', name: 'Autonomous Dept', trafficShare: 50, impressions: 500, conversions: 55, conversionRate: 11.0 },
      ],
      confidence: 99.8,
      winningVariant: 'B',
    };

    mockPrisma.growthExperiment.create.mockResolvedValue(mockCreated);

    const result = await service.createExperiment('org-1', {
      title: 'Homepage Headline Test',
      hypothesis: 'Focusing on Autonomous AI Department will double signups',
      metricName: 'Signup Rate',
      variants: [
        { id: 'A', name: 'Control', trafficShare: 50, impressions: 500, conversions: 25 },
        { id: 'B', name: 'Autonomous Dept', trafficShare: 50, impressions: 500, conversions: 55 },
      ],
    });

    expect(result.id).toBe('exp-1');
    expect(result.winningVariant).toBe('B');
    expect(mockPrisma.growthExperiment.create).toHaveBeenCalled();
  });

  it('calculates multi-touch attribution revenue across linear and first-touch models', async () => {
    const mockTouches = [
      {
        visitorId: 'vis-1',
        channel: 'organic_search',
        touchpointType: 'first_touch',
        revenueImpact: 1000,
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        visitorId: 'vis-1',
        channel: 'twitter',
        touchpointType: 'lead_creation',
        revenueImpact: 0,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        visitorId: 'vis-1',
        channel: 'linkedin',
        touchpointType: 'deal_closed',
        revenueImpact: 0,
        createdAt: new Date(),
      },
    ];

    mockPrisma.attributionTouch.findMany.mockResolvedValue(mockTouches);

    // Test linear model: 1000 split across 3 touches (~333 each)
    const linearResult = await service.getAttributionSummary('org-1', 'linear');
    expect(linearResult.totalTouches).toBe(3);
    expect(linearResult.channelRevenue['organic_search']).toBeGreaterThan(300);
    expect(linearResult.channelRevenue['twitter']).toBeGreaterThan(300);
    expect(linearResult.channelRevenue['linkedin']).toBeGreaterThan(300);

    // Test first-touch model: 1000 assigned to organic_search
    const firstTouchResult = await service.getAttributionSummary('org-1', 'first_touch');
    expect(firstTouchResult.channelRevenue['organic_search']).toBe(1000);
    expect(firstTouchResult.channelRevenue['twitter']).toBe(0);
    expect(firstTouchResult.channelRevenue['linkedin']).toBe(0);
  });
});
