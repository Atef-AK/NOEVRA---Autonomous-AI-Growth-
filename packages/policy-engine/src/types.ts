export type AutonomyLevel = 1 | 2 | 3 | 4 | 5;

export type ActionCategory =
  | 'research'
  | 'draft_content'
  | 'schedule_content'
  | 'publish_content'
  | 'community_reply'
  | 'email'
  | 'paid_ads'
  | 'website_changes';

export type PermissionMode = 'AI' | 'APPROVAL' | 'HUMAN' | 'POLICY';

export interface ActionContext {
  category: ActionCategory;
  agentRole: string;
  targetPlatform?: string;
  recipientCount?: number;
  containsLinks?: boolean;
  contentSnippet?: string;
  metadata?: Record<string, unknown>;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  requiresApproval: boolean;
  mode: PermissionMode;
  reason: string;
  ethicsCheckPassed: boolean;
  violations?: string[];
}
