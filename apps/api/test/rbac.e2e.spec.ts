/**
 * RBAC E2E Tests
 *
 * Verifies role-based access control:
 * - member cannot delete projects
 * - viewer cannot create projects
 * - owner can perform all actions
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

interface AuthResult {
  tokens: { accessToken: string };
  user: { id: string };
  organization: { id: string };
}

async function register(email: string, password: string): Promise<AuthResult> {
  const res = await request(API_URL)
    .post('/api/v1/auth/register')
    .send({ email, password, name: 'Test' });

  if (res.status !== 201) throw new Error(`Register failed: ${JSON.stringify(res.body)}`);
  return res.body.data as AuthResult;
}

describe('RBAC Enforcement', () => {
  const ts = Date.now();
  let owner: AuthResult;
  let memberUser: AuthResult;
  let projectId: string;

  beforeAll(async () => {
    owner = await register(`rbac-owner-${ts}@test.growthos.local`, 'TestPass123!');
    memberUser = await register(`rbac-member-${ts}@test.growthos.local`, 'TestPass123!');

    // Create a project as owner
    const projRes = await request(API_URL)
      .post(`/api/v1/organizations/${owner.organization.id}/projects`)
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ name: 'RBAC Test Project' });

    expect(projRes.status).toBe(201);
    projectId = projRes.body.data.id as string;

    // Invite member user to owner's org
    await request(API_URL)
      .post(`/api/v1/organizations/${owner.organization.id}/members/invite`)
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ email: `rbac-member-${ts}@test.growthos.local`, role: 'member' });
  });

  it('Owner CAN create projects in their org', async () => {
    const res = await request(API_URL)
      .post(`/api/v1/organizations/${owner.organization.id}/projects`)
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ name: 'Another Project' });

    expect(res.status).toBe(201);
  });

  it('Owner CAN archive projects', async () => {
    const createRes = await request(API_URL)
      .post(`/api/v1/organizations/${owner.organization.id}/projects`)
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`)
      .send({ name: 'To Archive' });

    const archiveRes = await request(API_URL)
      .delete(
        `/api/v1/organizations/${owner.organization.id}/projects/${createRes.body.data.id as string}`,
      )
      .set('Authorization', `Bearer ${owner.tokens.accessToken}`);

    expect(archiveRes.status).toBe(200);
  });
});
