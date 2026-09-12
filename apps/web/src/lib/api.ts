/**
 * API client for the GrowthOS backend.
 * All requests go through this client which handles
 * auth tokens, error normalization, and retries.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

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
