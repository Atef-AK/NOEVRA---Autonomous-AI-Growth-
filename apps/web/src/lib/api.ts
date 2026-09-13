/**
 * API client for the GrowthOS backend.
 * All requests go through this client which handles
 * auth tokens, error normalization, and retries.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(response.status, 'PARSE_ERROR', `HTTP ${response.status}`);
    }
    data = {};
  }

  if (!response.ok) {
    const errData = data as { error?: { code?: string; message?: string; details?: unknown } };
    const errBody = errData?.error;
    throw new ApiError(
      response.status,
      errBody?.code ?? 'UNKNOWN_ERROR',
      errBody?.message ?? `HTTP ${response.status}`,
      errBody?.details,
    );
  }

  const successData = data as { data?: T };
  return successData?.data as T;
}

// ============================================================
// AUTH
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: AuthUser;
  organization?: AuthOrganization;
}

export const auth = {
  register: (body: { email: string; password: string; name?: string }): Promise<AuthResult> =>
    request('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }): Promise<AuthResult> =>
    request('/auth/login', { method: 'POST', body }),

  refresh: (refreshToken: string): Promise<AuthTokens> =>
    request('/auth/refresh', { method: 'POST', body: { refreshToken } }),

  logout: (token: string): Promise<void> =>
    request('/auth/logout', { method: 'POST', token }),

  forgotPassword: (email: string): Promise<void> =>
    request('/auth/forgot-password', { method: 'POST', body: { email } }),

  resetPassword: (token: string, password: string): Promise<void> =>
    request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  verifyEmail: (token: string): Promise<void> =>
    request('/auth/verify-email', { method: 'POST', body: { token } }),
};

// ============================================================
// USERS
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export const users = {
  me: (token: string): Promise<UserProfile> =>
    request('/users/me', { token }),

  updateMe: (
    token: string,
    body: { name?: string; avatarUrl?: string },
  ): Promise<UserProfile> =>
    request('/users/me', { method: 'PATCH', body, token }),
};

// ============================================================
// ORGANIZATIONS
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl: string | null;
  createdAt: string;
  role?: string;
}

export const organizations = {
  list: (token: string): Promise<Organization[]> =>
    request('/organizations', { token }),

  get: (token: string, id: string): Promise<Organization> =>
    request(`/organizations/${id}`, { token }),

  create: (token: string, body: { name: string }): Promise<Organization> =>
    request('/organizations', { method: 'POST', body, token }),

  update: (
    token: string,
    id: string,
    body: { name?: string; logoUrl?: string },
  ): Promise<Organization> =>
    request(`/organizations/${id}`, { method: 'PATCH', body, token }),
};

// ============================================================
// PROJECTS
// ============================================================

export interface Project {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string | null;
  status: string;
  autonomyLevel: number;
  createdAt: string;
}

export const projects = {
  list: (token: string, orgId: string): Promise<Project[]> =>
    request(`/organizations/${orgId}/projects`, { token }),

  get: (token: string, orgId: string, projectId: string): Promise<Project> =>
    request(`/organizations/${orgId}/projects/${projectId}`, { token }),

  create: (
    token: string,
    orgId: string,
    body: { name: string; websiteUrl?: string; description?: string },
  ): Promise<Project> =>
    request(`/organizations/${orgId}/projects`, { method: 'POST', body, token }),

  update: (
    token: string,
    orgId: string,
    projectId: string,
    body: Partial<{ name: string; websiteUrl: string; description: string; status: string }>,
  ): Promise<Project> =>
    request(`/organizations/${orgId}/projects/${projectId}`, {
      method: 'PATCH',
      body,
      token,
    }),

  archive: (token: string, orgId: string, projectId: string): Promise<void> =>
    request(`/organizations/${orgId}/projects/${projectId}`, { method: 'DELETE', token }),
};

// ============================================================
// MEMBERS
// ============================================================

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  inviteStatus: string;
  joinedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export const members = {
  list: (token: string, orgId: string): Promise<Member[]> =>
    request(`/organizations/${orgId}/members`, { token }),

  invite: (
    token: string,
    orgId: string,
    body: { email: string; role: string },
  ): Promise<unknown> =>
    request(`/organizations/${orgId}/members/invite`, { method: 'POST', body, token }),

  updateRole: (
    token: string,
    orgId: string,
    memberId: string,
    role: string,
  ): Promise<Member> =>
    request(`/organizations/${orgId}/members/${memberId}/role`, {
      method: 'PATCH',
      body: { role },
      token,
    }),

  remove: (token: string, orgId: string, memberId: string): Promise<void> =>
    request(`/organizations/${orgId}/members/${memberId}`, { method: 'DELETE', token }),
};

// ============================================================
// AGENTS
// ============================================================

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  systemPrompt: string;
  preferredModel: string;
  allowedTools: string[];
  maxSteps: number;
  maxTokens: number;
  temperatureX10: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { runs: number };
}

export interface AgentStep {
  id: string;
  stepIndex: number;
  type: string;
  content: string | null;
  toolName: string | null;
  toolArgs: unknown;
  toolResult: unknown;
  toolError: string | null;
  inputTokens: number;
  outputTokens: number;
  provider: string | null;
  model: string | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  status: string;
  goal: string;
  result: string | null;
  errorMessage: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: string | number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  _count?: { steps: number };
  agent?: {
    id: string;
    name: string;
    slug: string;
    preferredModel: string;
  };
  steps?: AgentStep[];
}

export const agents = {
  list: (token: string, orgId: string): Promise<Agent[]> =>
    request(`/organizations/${orgId}/agents`, { token }),

  get: (token: string, orgId: string, agentId: string): Promise<Agent> =>
    request(`/organizations/${orgId}/agents/${agentId}`, { token }),

  create: (
    token: string,
    orgId: string,
    body: {
      name: string;
      description?: string;
      systemPrompt: string;
      preferredModel?: string;
      allowedTools?: string[];
      maxSteps?: number;
      maxTokens?: number;
    },
  ): Promise<Agent> =>
    request(`/organizations/${orgId}/agents`, { method: 'POST', body, token }),

  update: (
    token: string,
    orgId: string,
    agentId: string,
    body: Partial<{
      name: string;
      description: string;
      systemPrompt: string;
      preferredModel: string;
      allowedTools: string[];
      maxSteps: number;
      isActive: boolean;
    }>,
  ): Promise<Agent> =>
    request(`/organizations/${orgId}/agents/${agentId}`, { method: 'PATCH', body, token }),

  delete: (token: string, orgId: string, agentId: string): Promise<void> =>
    request(`/organizations/${orgId}/agents/${agentId}`, { method: 'DELETE', token }),

  triggerRun: (
    token: string,
    orgId: string,
    agentId: string,
    body: { goal: string; projectId?: string },
  ): Promise<AgentRun> =>
    request(`/organizations/${orgId}/agents/${agentId}/runs`, { method: 'POST', body, token }),

  listRuns: (token: string, orgId: string, agentId: string): Promise<AgentRun[]> =>
    request(`/organizations/${orgId}/agents/${agentId}/runs`, { token }),

  getRunDetails: (token: string, orgId: string, runId: string): Promise<AgentRun> =>
    request(`/organizations/${orgId}/runs/${runId}`, { token }),
};

// ============================================================
// COMPANY BRAIN & KNOWLEDGE
// ============================================================

export interface CompanyBrain {
  id: string;
  organizationId: string;
  name: string;
  summary: string | null;
  brandVoice: string | null;
  targetAudience: string | null;
  valueProps: string[];
  competitors: string[];
  positioning: string | null;
  version: number;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  organizationId: string;
  type: string;
  sourceUrl: string | null;
  title: string;
  status: string;
  lastCrawledAt: string | null;
  createdAt: string;
  _count?: { documents: number };
}

export interface SearchMatch {
  chunkId: string;
  content: string;
  similarity: number;
  tokenCount: number;
  documentTitle: string;
  sourceUrl: string | null;
}

export const brain = {
  get: (token: string, orgId: string): Promise<CompanyBrain> =>
    request(`/organizations/${orgId}/brain`, { token }),

  update: (
    token: string,
    orgId: string,
    body: Partial<{
      summary: string;
      brandVoice: string;
      targetAudience: string;
      valueProps: string[];
      competitors: string[];
      positioning: string;
    }>,
  ): Promise<CompanyBrain> =>
    request(`/organizations/${orgId}/brain`, { method: 'PATCH', body, token }),

  crawlUrl: (
    token: string,
    orgId: string,
    body: { url: string; projectId?: string },
  ): Promise<{ sourceId: string; documentId: string; title: string; chunksCreated: number; totalTokens: number }> =>
    request(`/organizations/${orgId}/brain/crawl`, { method: 'POST', body, token }),

  query: (
    token: string,
    orgId: string,
    body: { query: string; topK?: number; minSimilarity?: number },
  ): Promise<SearchMatch[]> =>
    request(`/organizations/${orgId}/brain/query`, { method: 'POST', body, token }),

  listSources: (token: string, orgId: string): Promise<KnowledgeSource[]> =>
    request(`/organizations/${orgId}/brain/sources`, { token }),
};

// ============================================================
// GROWTH STRATEGY & GOAL DECOMPOSITION
// ============================================================

export interface GrowthGoal {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  metricName: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string | null;
  status: 'draft' | 'active' | 'achieved' | 'missed';
  priority: number;
  strategyNotes: string | null;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  missions?: GrowthMission[];
  createdAt: string;
  updatedAt: string;
}

export interface GrowthMission {
  id: string;
  organizationId: string;
  goalId: string | null;
  title: string;
  objective: string;
  status: 'planned' | 'in_progress' | 'review' | 'completed' | 'failed';
  progress: number;
  estimatedImpact: string | null;
  ownerAgentRole: string | null;
  deadline: string | null;
  tasks?: GrowthTask[];
  goal?: { id: string; title: string; metricName: string };
  createdAt: string;
  updatedAt: string;
}

export interface GrowthTask {
  id: string;
  organizationId: string;
  missionId: string;
  agentId: string | null;
  agentRunId: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  output: string | null;
  isExecutable?: boolean;
  agent?: { id: string; name: string; slug: string } | null;
  agentRun?: { id: string; status: string; totalCostUsd: string | number | null } | null;
  mission?: { id: string; title: string; status: string };
  createdAt: string;
  updatedAt: string;
}

export interface GrowthOpportunity {
  id: string;
  organizationId: string;
  goalId: string | null;
  title: string;
  description: string | null;
  category: 'seo' | 'content' | 'social' | 'conversion' | 'outreach';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  riceScore: number;
  iceScore: number;
  status: 'discovered' | 'approved' | 'in_mission' | 'discarded';
  goal?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

export const strategy = {
  listGoals: (token: string, orgId: string): Promise<GrowthGoal[]> =>
    request(`/organizations/${orgId}/strategy/goals`, { token }),

  getGoal: (token: string, orgId: string, goalId: string): Promise<GrowthGoal> =>
    request(`/organizations/${orgId}/strategy/goals/${goalId}`, { token }),

  createGoal: (
    token: string,
    orgId: string,
    body: {
      title: string;
      description?: string;
      metricName: string;
      targetValue: number;
      currentValue?: number;
      unit?: string;
      deadline?: string;
      priority?: number;
    },
  ): Promise<GrowthGoal> =>
    request(`/organizations/${orgId}/strategy/goals`, { method: 'POST', body, token }),

  decomposeGoal: (
    token: string,
    orgId: string,
    goalId: string,
    body: { prompt?: string },
  ): Promise<GrowthGoal> =>
    request(`/organizations/${orgId}/strategy/goals/${goalId}/decompose`, {
      method: 'POST',
      body,
      token,
    }),

  listMissions: (token: string, orgId: string, goalId?: string): Promise<GrowthMission[]> => {
    const q = goalId ? `?goalId=${encodeURIComponent(goalId)}` : '';
    return request(`/organizations/${orgId}/strategy/missions${q}`, { token });
  },

  createMission: (
    token: string,
    orgId: string,
    body: {
      title: string;
      objective: string;
      goalId?: string;
      estimatedImpact?: string;
      ownerAgentRole?: string;
    },
  ): Promise<GrowthMission> =>
    request(`/organizations/${orgId}/strategy/missions`, { method: 'POST', body, token }),

  updateMission: (
    token: string,
    orgId: string,
    missionId: string,
    body: Partial<{ status: string; progress: number; estimatedImpact: string }>,
  ): Promise<GrowthMission> =>
    request(`/organizations/${orgId}/strategy/missions/${missionId}`, {
      method: 'PATCH',
      body,
      token,
    }),

  listTasks: (token: string, orgId: string, missionId?: string): Promise<GrowthTask[]> => {
    const q = missionId ? `?missionId=${encodeURIComponent(missionId)}` : '';
    return request(`/organizations/${orgId}/strategy/tasks${q}`, { token });
  },

  createTask: (
    token: string,
    orgId: string,
    body: {
      missionId: string;
      title: string;
      description?: string;
      priority?: string;
      agentId?: string;
      dependencies?: string[];
    },
  ): Promise<GrowthTask> =>
    request(`/organizations/${orgId}/strategy/tasks`, { method: 'POST', body, token }),

  executeTask: (token: string, orgId: string, taskId: string): Promise<GrowthTask> =>
    request(`/organizations/${orgId}/strategy/tasks/${taskId}/execute`, {
      method: 'POST',
      token,
    }),

  listOpportunities: (token: string, orgId: string): Promise<GrowthOpportunity[]> =>
    request(`/organizations/${orgId}/strategy/opportunities`, { token }),

  createOpportunity: (
    token: string,
    orgId: string,
    body: {
      title: string;
      description?: string;
      category?: string;
      reach: number;
      impact: number;
      confidence: number;
      effort: number;
      goalId?: string;
    },
  ): Promise<GrowthOpportunity> =>
    request(`/organizations/${orgId}/strategy/opportunities`, { method: 'POST', body, token }),

  convertOpportunity: (token: string, orgId: string, oppId: string): Promise<GrowthMission> =>
    request(`/organizations/${orgId}/strategy/opportunities/${oppId}/convert`, {
      method: 'POST',
      token,
    }),
};

// ============================================================
// CONTENT ENGINE & EDITORIAL PIPELINE
// ============================================================

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: string | null;
  endDate: string | null;
  _count?: { contentItems: number };
  createdAt: string;
}

export interface ContentRevision {
  id: string;
  contentItemId: string;
  version: number;
  content: string;
  summary: string | null;
  authorType: 'ai' | 'user';
  createdAt: string;
}

export interface ContentItem {
  id: string;
  organizationId: string;
  campaignId: string | null;
  missionId: string | null;
  authorAgentId: string | null;
  title: string;
  slug: string;
  type: 'blog_post' | 'tweet_thread' | 'linkedin_post' | 'newsletter' | 'changelog';
  status: 'idea' | 'brief' | 'drafting' | 'review' | 'scheduled' | 'published';
  content: string;
  tldr: string | null;
  outline: string[] | null;
  targetKeyword: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  readingTimeMin: number;
  brandVoiceScore: number;
  scheduledFor: string | null;
  publishedAt: string | null;
  campaign?: { id: string; name: string } | null;
  authorAgent?: { id: string; name: string; slug: string } | null;
  revisions?: ContentRevision[];
  _count?: { revisions: number };
  createdAt: string;
  updatedAt: string;
}

export const content = {
  listItems: (
    token: string,
    orgId: string,
    filters?: { type?: string; status?: string; campaignId?: string },
  ): Promise<ContentItem[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.campaignId) params.append('campaignId', filters.campaignId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/organizations/${orgId}/content/items${qs}`, { token });
  },

  getItem: (token: string, orgId: string, id: string): Promise<ContentItem> =>
    request(`/organizations/${orgId}/content/items/${id}`, { token }),

  createItem: (
    token: string,
    orgId: string,
    body: {
      title: string;
      content: string;
      type?: string;
      status?: string;
      targetKeyword?: string;
      campaignId?: string;
    },
  ): Promise<ContentItem> =>
    request(`/organizations/${orgId}/content/items`, { method: 'POST', body, token }),

  updateItem: (
    token: string,
    orgId: string,
    id: string,
    body: Partial<{
      title: string;
      content: string;
      status: string;
      tldr: string;
      targetKeyword: string;
      scheduledFor: string;
    }>,
  ): Promise<ContentItem> =>
    request(`/organizations/${orgId}/content/items/${id}`, {
      method: 'PATCH',
      body,
      token,
    }),

  generate: (
    token: string,
    orgId: string,
    body: {
      topic: string;
      type: string;
      targetKeyword?: string;
      targetAudience?: string;
      campaignId?: string;
    },
  ): Promise<ContentItem> =>
    request(`/organizations/${orgId}/content/generate`, {
      method: 'POST',
      body,
      token,
    }),

  repurpose: (
    token: string,
    orgId: string,
    id: string,
    body: { targetType: string },
  ): Promise<ContentItem> =>
    request(`/organizations/${orgId}/content/items/${id}/repurpose`, {
      method: 'POST',
      body,
      token,
    }),

  listCampaigns: (token: string, orgId: string): Promise<Campaign[]> =>
    request(`/organizations/${orgId}/content/campaigns`, { token }),

  createCampaign: (
    token: string,
    orgId: string,
    body: { name: string; description?: string; startDate?: string; endDate?: string },
  ): Promise<Campaign> =>
    request(`/organizations/${orgId}/content/campaigns`, { method: 'POST', body, token }),
};

// ============================================================
// CONNECTORS & SOCIAL DISTRIBUTION
// ============================================================

export interface ConnectorAccount {
  id: string;
  organizationId: string;
  provider: 'twitter' | 'linkedin' | 'github' | 'slack' | 'webhook';
  name: string;
  status: 'connected' | 'error' | 'expired';
  lastSyncAt: string | null;
  _count?: { socialPosts: number };
  createdAt: string;
}

export interface SocialPost {
  id: string;
  organizationId: string;
  connectorAccountId: string;
  contentItemId: string | null;
  provider: 'twitter' | 'linkedin' | 'github' | 'slack' | 'webhook';
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  payload: {
    text: string;
    thread?: string[];
    mediaUrls?: string[];
  };
  externalPostId: string | null;
  externalPostUrl: string | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  impressions: number;
  engagements: number;
  clicks: number;
  connectorAccount?: { id: string; name: string; provider: string } | null;
  contentItem?: { id: string; title: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const connectors = {
  listAccounts: (token: string, orgId: string): Promise<ConnectorAccount[]> =>
    request(`/organizations/${orgId}/connectors/accounts`, { token }),

  connectAccount: (
    token: string,
    orgId: string,
    body: {
      provider: string;
      name: string;
      credentials: Record<string, string>;
    },
  ): Promise<ConnectorAccount> =>
    request(`/organizations/${orgId}/connectors/accounts`, { method: 'POST', body, token }),

  removeAccount: (token: string, orgId: string, id: string): Promise<{ success: boolean }> =>
    request(`/organizations/${orgId}/connectors/accounts/${id}`, { method: 'DELETE', token }),

  listPosts: (token: string, orgId: string, status?: string): Promise<SocialPost[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/organizations/${orgId}/connectors/posts${qs}`, { token });
  },

  createPost: (
    token: string,
    orgId: string,
    body: {
      connectorAccountId: string;
      provider: string;
      text: string;
      thread?: string[];
      scheduledFor?: string;
      contentItemId?: string;
    },
  ): Promise<SocialPost> =>
    request(`/organizations/${orgId}/connectors/posts`, { method: 'POST', body, token }),

  publishPost: (token: string, orgId: string, id: string): Promise<SocialPost> =>
    request(`/organizations/${orgId}/connectors/posts/${id}/publish`, {
      method: 'POST',
      token,
    }),
};

// ============================================================
// TECHNICAL SEO & SERP TRACKING
// ============================================================

export interface SeoIssue {
  type: 'error' | 'warning' | 'notice';
  rule: string;
  message: string;
  recommendation: string;
}

export interface SeoAudit {
  id: string;
  organizationId: string;
  targetUrl: string;
  overallScore: number;
  titleTag: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  h1Count: number;
  h2Count: number;
  brokenLinksCount: number;
  loadTimeMs: number;
  status: string;
  issues: SeoIssue[];
  createdAt: string;
}

export interface KeywordTrack {
  id: string;
  organizationId: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  currentRank: number | null;
  targetRank: number;
  intent: string;
  rankHistory: Array<{ date: string; rank: number }>;
  createdAt: string;
}

export const seo = {
  listAudits: (token: string, orgId: string): Promise<SeoAudit[]> =>
    request(`/organizations/${orgId}/seo/audits`, { token }),

  runAudit: (
    token: string,
    orgId: string,
    body: { targetUrl: string; projectId?: string },
  ): Promise<SeoAudit> =>
    request(`/organizations/${orgId}/seo/audits`, { method: 'POST', body, token }),

  getAudit: (token: string, orgId: string, id: string): Promise<SeoAudit> =>
    request(`/organizations/${orgId}/seo/audits/${id}`, { token }),

  listKeywords: (token: string, orgId: string): Promise<KeywordTrack[]> =>
    request(`/organizations/${orgId}/seo/keywords`, { token }),

  trackKeyword: (
    token: string,
    orgId: string,
    body: { keyword: string; targetRank?: number; intent?: string },
  ): Promise<KeywordTrack> =>
    request(`/organizations/${orgId}/seo/keywords`, { method: 'POST', body, token }),
};

// ============================================================
// LEADS & COMMUNITY RADAR
// ============================================================

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  company: string;
  title: string | null;
  stage: 'new' | 'enriching' | 'qualified' | 'outreach' | 'converted' | 'disqualified';
  source: 'community' | 'scraping' | 'inbound' | 'intent';
  score: number;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  enrichmentData: {
    headcount?: number;
    estimatedArr?: string;
    technologies?: string[];
    intentSignals?: string[];
    lastEnrichedAt?: string;
  };
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityInteraction {
  id: string;
  organizationId: string;
  platform: 'twitter' | 'reddit' | 'hackernews' | 'linkedin';
  postUrl: string;
  author: string;
  title: string | null;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  intentScore: number;
  replyDraft: string | null;
  status: 'unreviewed' | 'approved' | 'replied' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export const leads = {
  listLeads: (
    token: string,
    orgId: string,
    filters?: { stage?: string; minScore?: number },
  ): Promise<Lead[]> => {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    if (filters?.minScore !== undefined) params.append('minScore', filters.minScore.toString());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/organizations/${orgId}/leads${qs}`, { token });
  },

  getLead: (token: string, orgId: string, id: string): Promise<Lead> =>
    request(`/organizations/${orgId}/leads/${id}`, { token }),

  createLead: (
    token: string,
    orgId: string,
    body: {
      name: string;
      email?: string;
      company: string;
      title?: string;
      stage?: string;
      source?: string;
      score?: number;
      websiteUrl?: string;
      linkedinUrl?: string;
      twitterUrl?: string;
      notes?: string;
    },
  ): Promise<Lead> =>
    request(`/organizations/${orgId}/leads`, { method: 'POST', body, token }),

  updateLead: (
    token: string,
    orgId: string,
    id: string,
    body: Partial<{
      name: string;
      email: string;
      company: string;
      title: string;
      stage: string;
      score: number;
      notes: string;
    }>,
  ): Promise<Lead> =>
    request(`/organizations/${orgId}/leads/${id}`, { method: 'PATCH', body, token }),

  enrichLead: (token: string, orgId: string, id: string): Promise<Lead> =>
    request(`/organizations/${orgId}/leads/${id}/enrich`, { method: 'POST', token }),

  deleteLead: (token: string, orgId: string, id: string): Promise<{ success: boolean }> =>
    request(`/organizations/${orgId}/leads/${id}`, { method: 'DELETE', token }),

  listCommunity: (token: string, orgId: string, status?: string): Promise<CommunityInteraction[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/organizations/${orgId}/leads/community${qs}`, { token });
  },

  scanCommunity: (
    token: string,
    orgId: string,
    body: { keywords?: string[]; platforms?: string[] },
  ): Promise<CommunityInteraction[]> =>
    request(`/organizations/${orgId}/leads/community/scan`, { method: 'POST', body, token }),

  draftReply: (
    token: string,
    orgId: string,
    id: string,
    body: { intentDirective?: string },
  ): Promise<CommunityInteraction> =>
    request(`/organizations/${orgId}/leads/community/${id}/reply`, {
      method: 'POST',
      body,
      token,
    }),

  updateCommunityStatus: (
    token: string,
    orgId: string,
    id: string,
    status: string,
  ): Promise<CommunityInteraction> =>
    request(`/organizations/${orgId}/leads/community/${id}/status`, {
      method: 'PATCH',
      body: { status },
      token,
    }),
};

// ============================================================
// EXPERIMENTS & ATTRIBUTION ENGINE
// ============================================================

export interface ExperimentVariant {
  id: string;
  name: string;
  trafficShare: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export interface GrowthExperiment {
  id: string;
  organizationId: string;
  title: string;
  hypothesis: string;
  metricName: string;
  status: 'draft' | 'running' | 'concluded' | 'cancelled';
  variants: ExperimentVariant[];
  confidence: number;
  winningVariant: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export interface AttributionSummary {
  modelType: string;
  totalTouches: number;
  channelRevenue: Record<string, number>;
  channelTouchesCount: Record<string, number>;
  totalAttributedRevenue: number;
}

export const experiments = {
  list: (token: string, orgId: string, status?: string): Promise<GrowthExperiment[]> => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/organizations/${orgId}/experiments${qs}`, { token });
  },

  get: (token: string, orgId: string, id: string): Promise<GrowthExperiment> =>
    request(`/organizations/${orgId}/experiments/${id}`, { token }),

  create: (
    token: string,
    orgId: string,
    body: {
      title: string;
      hypothesis: string;
      metricName: string;
      variants: Array<{
        id: string;
        name: string;
        trafficShare: number;
        impressions?: number;
        conversions?: number;
      }>;
    },
  ): Promise<GrowthExperiment> =>
    request(`/organizations/${orgId}/experiments`, { method: 'POST', body, token }),

  recordMetrics: (
    token: string,
    orgId: string,
    id: string,
    body: { variantId: string; impressions: number; conversions: number },
  ): Promise<GrowthExperiment> =>
    request(`/organizations/${orgId}/experiments/${id}/metrics`, {
      method: 'POST',
      body,
      token,
    }),

  getAttribution: (
    token: string,
    orgId: string,
    model?: string,
  ): Promise<AttributionSummary> => {
    const qs = model ? `?model=${encodeURIComponent(model)}` : '';
    return request(`/organizations/${orgId}/experiments/attribution/summary${qs}`, { token });
  },

  recordTouchpoint: (
    token: string,
    orgId: string,
    body: {
      visitorId: string;
      channel: string;
      touchpointType: string;
      campaignName?: string;
      revenueImpact?: number;
    },
  ): Promise<unknown> =>
    request(`/organizations/${orgId}/experiments/attribution/touch`, {
      method: 'POST',
      body,
      token,
    }),
};

// ============================================================
// AUTONOMOUS LOOP & DEPARTMENT ORCHESTRATOR
// ============================================================

export interface DepartmentCycleAction {
  agent: string;
  action: string;
  status: string;
  latencyMs: number;
}

export interface DepartmentCycle {
  id: string;
  organizationId: string;
  cycleNumber: number;
  status: 'active' | 'completed' | 'failed';
  summary: string | null;
  actionsDispatched: number;
  telemetry: {
    focusArea?: string;
    autonomyLevel?: number;
    brandVoice?: string;
    actions?: DepartmentCycleAction[];
    totalExecutionTimeMs?: number;
  };
  startedAt: string;
  completedAt: string | null;
}

export interface AutonomousSchedule {
  id: string;
  organizationId: string;
  name: string;
  cronExpression: string;
  isActive: boolean;
  agentRole: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface OrchestratorSettings {
  autonomyLevel: number;
  isPaused: boolean;
  timezone: string;
}

export const orchestrator = {
  listCycles: (token: string, orgId: string): Promise<DepartmentCycle[]> =>
    request(`/organizations/${orgId}/orchestrator/cycles`, { token }),

  triggerCycle: (
    token: string,
    orgId: string,
    body?: { focusArea?: string },
  ): Promise<DepartmentCycle> =>
    request(`/organizations/${orgId}/orchestrator/cycles/trigger`, {
      method: 'POST',
      body: body ?? {},
      token,
    }),

  listSchedules: (token: string, orgId: string): Promise<AutonomousSchedule[]> =>
    request(`/organizations/${orgId}/orchestrator/schedules`, { token }),

  toggleSchedule: (
    token: string,
    orgId: string,
    id: string,
    isActive: boolean,
  ): Promise<AutonomousSchedule> =>
    request(`/organizations/${orgId}/orchestrator/schedules/${id}`, {
      method: 'PATCH',
      body: { isActive },
      token,
    }),

  getSettings: (token: string, orgId: string): Promise<OrchestratorSettings> =>
    request(`/organizations/${orgId}/orchestrator/settings`, { token }),

  updateSettings: (
    token: string,
    orgId: string,
    body: Partial<{ autonomyLevel: number; isPaused: boolean }>,
  ): Promise<OrchestratorSettings> =>
    request(`/organizations/${orgId}/orchestrator/settings`, {
      method: 'PATCH',
      body,
      token,
    }),
};

// ============================================================
// ONBOARDING
// ============================================================

export interface OnboardingProgress {
  step: number;
  totalSteps: number;
  stage: string;
  message: string;
  data?: Record<string, unknown>;
  completed: boolean;
  error?: string;
}

export interface OnboardingResult {
  brainId: string;
  projectId: string;
  mission: string;
  contentQueued: number;
  seoAuditQueued: boolean;
}

export const onboarding = {
  /** POST — full sync analysis (returns when all 7 steps complete) */
  analyze: (
    token: string,
    orgId: string,
    websiteUrl: string,
  ): Promise<OnboardingResult> =>
    request(`/organizations/${orgId}/onboarding/analyze`, {
      method: 'POST',
      body: { websiteUrl },
      token,
    }),

  /** GET — SSE stream for real-time progress events */
  streamUrl: (orgId: string, websiteUrl: string): string =>
    `${API_URL}/api/v1/organizations/${orgId}/onboarding/stream?url=${encodeURIComponent(websiteUrl)}`,
};
