import { describe, it, expect, vi } from 'vitest';
import { EventBus, SystemEvent } from './index';

describe('@growthos/events', () => {
  it('publishes and subscribes to typed system events synchronously', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('lead.qualified', handler);

    const event: SystemEvent = {
      type: 'lead.qualified',
      timestamp: new Date().toISOString(),
      payload: {
        organizationId: 'org-1',
        leadId: 'lead-123',
        company: 'ScaleCo',
        score: 95,
      },
    };

    bus.emit(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('supports wildcard pattern subscriptions across bounded contexts', async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('agent.**', handler);

    bus.emit({
      type: 'agent.run.started',
      timestamp: new Date().toISOString(),
      payload: {
        organizationId: 'org-1',
        runId: 'run-1',
        agentId: 'seo-agent',
        goal: 'Crawl target domain',
      },
    });

    bus.emit({
      type: 'agent.run.completed',
      timestamp: new Date().toISOString(),
      payload: {
        organizationId: 'org-1',
        runId: 'run-1',
        agentId: 'seo-agent',
        totalTokens: 520,
        costUsd: 0.005,
      },
    });

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
