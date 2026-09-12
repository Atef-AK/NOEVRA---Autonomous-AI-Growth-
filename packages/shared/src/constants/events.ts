/** Internal system event names (typed string literals) */
export const EVENTS = {
  // Organization
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',

  // Project
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',

  // Member
  MEMBER_INVITED: 'member.invited',
  MEMBER_JOINED: 'member.joined',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',

  // Auth
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_EMAIL_VERIFIED: 'user.email_verified',
  USER_PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',
  USER_PASSWORD_RESET: 'user.password_reset',

  // Research
  RESEARCH_STARTED: 'research.started',
  RESEARCH_COMPLETED: 'research.completed',

  // Agent
  AGENT_STARTED: 'agent.started',
  AGENT_COMPLETED: 'agent.completed',
  AGENT_FAILED: 'agent.failed',

  // Content
  CONTENT_CREATED: 'content.created',
  CONTENT_APPROVED: 'content.approved',
  CONTENT_PUBLISHED: 'content.published',

  // Approval
  APPROVAL_REQUESTED: 'approval.requested',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
