import {
  ActionCategory,
  ActionContext,
  AutonomyLevel,
  PolicyEvaluationResult,
} from './types';
import { getPermissionMode } from './policy-matrix';
import { evaluateEthicsHardStops } from './ethics-engine';

export class PolicyEvaluator {
  evaluate(
    autonomyLevel: AutonomyLevel,
    context: ActionContext,
  ): PolicyEvaluationResult {
    // 1. First enforce non-negotiable Ethics Hard Stops
    const ethics = evaluateEthicsHardStops(context);
    if (!ethics.passed) {
      return {
        allowed: false,
        requiresApproval: false,
        mode: 'HUMAN',
        reason: 'Action strictly blocked by ethics policy.',
        ethicsCheckPassed: false,
        violations: ethics.violations,
      };
    }

    // 2. Check permission mode from Autonomy Matrix
    const mode = getPermissionMode(context.category, autonomyLevel);

    switch (mode) {
      case 'AI':
        return {
          allowed: true,
          requiresApproval: false,
          mode: 'AI',
          reason: `Action allowed autonomously at Autonomy Level ${autonomyLevel}.`,
          ethicsCheckPassed: true,
        };

      case 'APPROVAL':
        return {
          allowed: true,
          requiresApproval: true,
          mode: 'APPROVAL',
          reason: `Action prepared as draft; requires human approval under Autonomy Level ${autonomyLevel}.`,
          ethicsCheckPassed: true,
        };

      case 'POLICY':
        return {
          allowed: true,
          requiresApproval: false,
          mode: 'POLICY',
          reason: `Action permitted autonomously within configured policy boundaries at Autonomy Level ${autonomyLevel}.`,
          ethicsCheckPassed: true,
        };

      case 'HUMAN':
      default:
        return {
          allowed: false,
          requiresApproval: false,
          mode: 'HUMAN',
          reason: `Action requires full manual human execution under Autonomy Level ${autonomyLevel}.`,
          ethicsCheckPassed: true,
        };
    }
  }
}

export const defaultPolicyEvaluator = new PolicyEvaluator();
