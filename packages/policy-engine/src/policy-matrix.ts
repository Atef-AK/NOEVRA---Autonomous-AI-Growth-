import { ActionCategory, AutonomyLevel, PermissionMode } from './types';

export const POLICY_MATRIX: Record<ActionCategory, Record<AutonomyLevel, PermissionMode>> = {
  research: {
    1: 'AI',
    2: 'AI',
    3: 'AI',
    4: 'AI',
    5: 'AI',
  },
  draft_content: {
    1: 'AI',
    2: 'AI',
    3: 'AI',
    4: 'AI',
    5: 'AI',
  },
  schedule_content: {
    1: 'HUMAN',
    2: 'HUMAN',
    3: 'APPROVAL',
    4: 'AI',
    5: 'AI',
  },
  publish_content: {
    1: 'HUMAN',
    2: 'APPROVAL',
    3: 'APPROVAL',
    4: 'POLICY',
    5: 'POLICY',
  },
  community_reply: {
    1: 'HUMAN',
    2: 'APPROVAL',
    3: 'APPROVAL',
    4: 'POLICY',
    5: 'POLICY',
  },
  email: {
    1: 'HUMAN',
    2: 'APPROVAL',
    3: 'APPROVAL',
    4: 'POLICY',
    5: 'POLICY',
  },
  paid_ads: {
    1: 'HUMAN',
    2: 'HUMAN',
    3: 'APPROVAL',
    4: 'APPROVAL',
    5: 'POLICY',
  },
  website_changes: {
    1: 'HUMAN',
    2: 'HUMAN',
    3: 'APPROVAL',
    4: 'APPROVAL',
    5: 'POLICY',
  },
};

export function getPermissionMode(
  category: ActionCategory,
  level: AutonomyLevel,
): PermissionMode {
  return POLICY_MATRIX[category]?.[level] ?? 'APPROVAL';
}
