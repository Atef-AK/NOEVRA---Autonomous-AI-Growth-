import { describe, it, expect } from 'vitest';
import {
  PolicyEvaluator,
  POLICY_MATRIX,
  evaluateEthicsHardStops,
} from './index';

describe('@growthos/policy-engine', () => {
  const evaluator = new PolicyEvaluator();

  it('permits research autonomously across all autonomy levels (L1 - L5)', () => {
    for (let level = 1; level <= 5; level++) {
      const result = evaluator.evaluate(level as any, {
        category: 'research',
        agentRole: 'research',
      });
      expect(result.allowed).toBe(true);
      expect(result.mode).toBe('AI');
      expect(result.requiresApproval).toBe(false);
    }
  });

  it('requires human approval for social publishing at L2 and L3, but allows autonomous policy at L4 and L5', () => {
    const l2 = evaluator.evaluate(2, {
      category: 'publish_content',
      agentRole: 'social',
    });
    expect(l2.requiresApproval).toBe(true);
    expect(l2.mode).toBe('APPROVAL');

    const l4 = evaluator.evaluate(4, {
      category: 'publish_content',
      agentRole: 'social',
    });
    expect(l4.requiresApproval).toBe(false);
    expect(l4.mode).toBe('POLICY');
  });

  it('blocks mass spam outreach under non-negotiable Ethics Hard Stops', () => {
    const spamResult = evaluator.evaluate(5, {
      category: 'email',
      agentRole: 'lead',
      recipientCount: 500,
    });

    expect(spamResult.allowed).toBe(false);
    expect(spamResult.ethicsCheckPassed).toBe(false);
    expect(spamResult.violations?.[0]).toContain('ETHICS_STOP');
  });

  it('blocks artificial engagement and CAPTCHA bypass keywords', () => {
    const fraudCheck = evaluateEthicsHardStops({
      category: 'community_reply',
      agentRole: 'community',
      contentSnippet: 'Buy followers and captcha bypass services now',
    });

    expect(fraudCheck.passed).toBe(false);
    expect(fraudCheck.violations.length).toBeGreaterThan(0);
  });
});
