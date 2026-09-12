/**
 * Auth flow E2E tests.
 * Tests register → login → refresh → logout cycle.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';

describe('Authentication Flow', () => {
  const timestamp = Date.now();
  const testEmail = `auth-test-${timestamp}@test.growthos.local`;
  const testPassword = 'SecurePass123!';

  let accessToken: string;
  let refreshToken: string;

  it('POST /auth/register — creates user and returns tokens', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.organization).toBeTruthy();

    // Verify no sensitive data leaked
    expect(res.body.data.user.passwordHash).toBeUndefined();

    accessToken = res.body.data.tokens.accessToken as string;
    refreshToken = res.body.data.tokens.refreshToken as string;
  });

  it('POST /auth/register — duplicate email returns 409', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
  });

  it('POST /auth/login — valid credentials return tokens', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();

    refreshToken = res.body.data.tokens.refreshToken as string;
  });

  it('POST /auth/login — wrong password returns 401', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('POST /auth/login — nonexistent email returns 401 (not 404)', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/login')
      .send({ email: `nobody-${timestamp}@test.local`, password: 'anything' });

    // Must be 401, not 404 — prevent user enumeration
    expect(res.status).toBe(401);
  });

  it('GET /users/me — valid token returns profile', async () => {
    const res = await request(API_URL)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('GET /users/me — no token returns 401', async () => {
    const res = await request(API_URL).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me — invalid token returns 401', async () => {
    const res = await request(API_URL)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh — valid refresh token issues new access token', async () => {
    const res = await request(API_URL)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    // Old refresh token should no longer work (rotation)
    const oldToken = refreshToken;
    refreshToken = res.body.data.refreshToken as string;
    accessToken = res.body.data.accessToken as string;

    const reuseRes = await request(API_URL)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldToken });

    // Reusing old token should fail (rotation enforcement)
    expect(reuseRes.status).toBe(401);
  });

  it('POST /auth/logout — revokes tokens', async () => {
    const logoutRes = await request(API_URL)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutRes.status).toBe(200);

    // Refresh token should no longer work after logout
    const refreshRes = await request(API_URL)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it('GET /health — returns ok without auth', async () => {
    const res = await request(API_URL).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
