/**
 * CRITICAL SECURITY TEST: Tenant Isolation
 *
 * Verifies that:
 * - User A cannot access User B's projects (gets 404, not 403)
 * - User A cannot list User B's members
 * - Cross-tenant requests are silently denied (404) to avoid confirming existence
 *
 * This test must ALWAYS pass. Never remove or weaken it.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Base URL — must match running API in test mode
const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

interface AuthResult {
  tokens: { accessToken: string; refreshToken: string };
  user: { id: string; email: string };
  organization: { id: string; slug: string };
}

async function register(email: string, password: string): Promise<AuthResult> {
  const res = await request(API_URL)
    .post('/api/v1/auth/register')
    .send({ email, password, name: `Test User ${Date.now()}` });

  if (res.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  }

  return res.body.data as AuthResult;
}

async function createProject(
  token: string,
  orgId: string,
  name: string,
): Promise<{ id: string }> {
  const res = await request(API_URL)
    .post(`/api/v1/organizations/${orgId}/projects`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name });

  if (res.status !== 201) {
    throw new Error(`Project creation failed: ${JSON.stringify(res.body)}`);
  }

  return res.body.data as { id: string };
}

describe('Tenant Isolation', () => {
  let userA: AuthResult;
  let userB: AuthResult;
  let projectA: { id: string };

  const timestamp = Date.now();

  beforeAll(async () => {
    userA = await register(`tenant-isolation-a-${timestamp}@test.growthos.local`, 'TestPass123!');
    userB = await register(`tenant-isolation-b-${timestamp}@test.growthos.local`, 'TestPass123!');
    projectA = await createProject(
      userA.tokens.accessToken,
      userA.organization.id,
      'User A Secret Project',
    );
  });

  it('User B cannot GET User A project — returns 404', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/organizations/${userA.organization.id}/projects/${projectA.id}`)
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`);

    // Must be 404 (not found) — not 403 (forbidden) which would confirm existence
    expect(res.status).toBe(404);
  });

  it('User B cannot LIST User A projects — returns 404', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/organizations/${userA.organization.id}/projects`)
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`);

    expect(res.status).toBe(404);
  });

  it('User B cannot LIST User A members — returns 404', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/organizations/${userA.organization.id}/members`)
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`);

    expect(res.status).toBe(404);
  });

  it('User B cannot GET User A organization — returns 404', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/organizations/${userA.organization.id}`)
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`);

    expect(res.status).toBe(404);
  });

  it('User B CANNOT create project in User A org — returns 404', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/organizations/${userA.organization.id}/projects`)
      .set('Authorization', `Bearer ${userB.tokens.accessToken}`)
      .send({ name: 'Infiltration Project' });

    expect(res.status).toBe(404);
  });

  it('User A CAN access their own project', async () => {
    const res = await request(API_URL)
      .get(`/api/v1/organizations/${userA.organization.id}/projects/${projectA.id}`)
      .set('Authorization', `Bearer ${userA.tokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(projectA.id);
  });
});
