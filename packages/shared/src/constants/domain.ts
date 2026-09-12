/** Subscription plan identifiers */
export const PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  GROWTH: 'growth',
  SCALE: 'scale',
  ENTERPRISE: 'enterprise',
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

/** Autonomy levels — controls what agents can do without human approval */
export const AUTONOMY_LEVELS = {
  COPILOT: 1,
  ASSISTED: 2,
  SUPERVISED: 3,
  AUTONOMOUS: 4,
  AUTONOMOUS_GROWTH: 5,
} as const;

export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[keyof typeof AUTONOMY_LEVELS];

/** Project statuses */
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

/** Invitation statuses */
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];
