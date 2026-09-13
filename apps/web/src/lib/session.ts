/**
 * Auth session management.
 * Stores tokens in localStorage (client-side) with
 * automatic refresh token rotation.
 */
'use client';

import { auth, type AuthResult, type AuthTokens } from './api';

const ACCESS_TOKEN_KEY = 'gos_access_token';
const REFRESH_TOKEN_KEY = 'gos_refresh_token';
const USER_KEY = 'gos_user';
const ORG_KEY = 'gos_org';

export function saveSession(result: AuthResult): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, result.tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, result.tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));

  if (result.organization) {
    localStorage.setItem(ORG_KEY, JSON.stringify(result.organization));
  } else {
    // Attempt extracting orgId from accessToken
    try {
      const parts = result.tokens.accessToken.split('.');
      if (parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.orgId) {
          localStorage.setItem(
            ORG_KEY,
            JSON.stringify({ id: payload.orgId, name: 'My Workspace', slug: 'workspace' }),
          );
        }
      }
    } catch {
      // ignore
    }
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORG_KEY);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthResult['user'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthResult['user']; }
  catch { return null; }
}

export function getStoredOrg(): AuthResult['organization'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ORG_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthResult['organization'];
      if (parsed?.id) return parsed;
    } catch {
      // continue to JWT fallback
    }
  }

  // Fallback: Recover organization from access token directly
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    try {
      const parts = token.split('.');
      if (parts[1]) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload?.orgId) {
          const recovered: AuthResult['organization'] = {
            id: payload.orgId,
            name: 'Workspace',
            slug: 'workspace',
          };
          localStorage.setItem(ORG_KEY, JSON.stringify(recovered));
          return recovered;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export async function refreshSession(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const tokens = await auth.refresh(refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    return tokens;
  } catch {
    clearSession();
    return null;
  }
}
