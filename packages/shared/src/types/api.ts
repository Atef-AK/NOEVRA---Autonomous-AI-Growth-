/** Standard API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Standard error codes */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** User-facing profile (safe — no password hash) */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
}

/** Organization public info */
export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
}

/** Project summary */
export interface ProjectSummary {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  description: string | null;
  status: string;
  createdAt: string;
}

/** Member info */
export interface MemberInfo {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  user: UserProfile;
  joinedAt: string | null;
  invitedAt: string;
}
