export type GoalStatus = 'draft' | 'active' | 'achieved' | 'missed';
export type MissionStatus = 'planned' | 'in_progress' | 'review' | 'completed' | 'failed';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type OpportunityCategory = 'seo' | 'content' | 'social' | 'conversion' | 'outreach';
export type OpportunityStatus = 'discovered' | 'approved' | 'in_mission' | 'discarded';

export interface GrowthGoalSummary {
  id: string;
  organizationId: string;
  projectId?: string | null;
  title: string;
  description?: string | null;
  metricName: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string | null;
  status: GoalStatus;
  priority: number;
  strategyNotes?: string | null;
  progressPercentage: number;
  missionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthMissionSummary {
  id: string;
  organizationId: string;
  projectId?: string | null;
  goalId?: string | null;
  title: string;
  objective: string;
  status: MissionStatus;
  progress: number;
  estimatedImpact?: string | null;
  ownerAgentRole?: string | null;
  deadline?: string | null;
  tasksCount: number;
  completedTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthTaskSummary {
  id: string;
  organizationId: string;
  projectId?: string | null;
  missionId: string;
  agentId?: string | null;
  agentRunId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  output?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthOpportunitySummary {
  id: string;
  organizationId: string;
  projectId?: string | null;
  goalId?: string | null;
  title: string;
  description?: string | null;
  category: OpportunityCategory;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  riceScore: number;
  iceScore: number;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}
