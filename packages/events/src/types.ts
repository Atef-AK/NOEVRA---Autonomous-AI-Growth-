export type SystemEvent =
  | {
      type: 'agent.run.started';
      timestamp: string;
      payload: {
        organizationId: string;
        runId: string;
        agentId: string;
        goal: string;
      };
    }
  | {
      type: 'agent.run.completed';
      timestamp: string;
      payload: {
        organizationId: string;
        runId: string;
        agentId: string;
        totalTokens: number;
        costUsd: number;
      };
    }
  | {
      type: 'content.published';
      timestamp: string;
      payload: {
        organizationId: string;
        contentId: string;
        channel: string;
        externalUrl?: string;
      };
    }
  | {
      type: 'lead.qualified';
      timestamp: string;
      payload: {
        organizationId: string;
        leadId: string;
        company: string;
        score: number;
      };
    }
  | {
      type: 'seo.audit.completed';
      timestamp: string;
      payload: {
        organizationId: string;
        auditId: string;
        targetUrl: string;
        score: number;
      };
    }
  | {
      type: 'experiment.winner.declared';
      timestamp: string;
      payload: {
        organizationId: string;
        experimentId: string;
        winningVariantId: string;
        confidence: number;
      };
    }
  | {
      type: 'cycle.completed';
      timestamp: string;
      payload: {
        organizationId: string;
        cycleNumber: number;
        actionsDispatched: number;
      };
    };

export type EventType = SystemEvent['type'];
export type EventHandler<T extends SystemEvent = SystemEvent> = (
  event: T,
) => void | Promise<void>;
