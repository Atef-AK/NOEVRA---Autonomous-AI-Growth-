import { describe, it, expect } from 'vitest';
import { hasRole, ROLES } from './roles';

describe('hasRole', () => {
  it('owner has all roles', () => {
    expect(hasRole(ROLES.OWNER, ROLES.OWNER)).toBe(true);
    expect(hasRole(ROLES.OWNER, ROLES.ADMIN)).toBe(true);
    expect(hasRole(ROLES.OWNER, ROLES.MANAGER)).toBe(true);
    expect(hasRole(ROLES.OWNER, ROLES.MEMBER)).toBe(true);
    expect(hasRole(ROLES.OWNER, ROLES.VIEWER)).toBe(true);
  });

  it('viewer cannot be owner, admin, manager, or member', () => {
    expect(hasRole(ROLES.VIEWER, ROLES.OWNER)).toBe(false);
    expect(hasRole(ROLES.VIEWER, ROLES.ADMIN)).toBe(false);
    expect(hasRole(ROLES.VIEWER, ROLES.MANAGER)).toBe(false);
    expect(hasRole(ROLES.VIEWER, ROLES.MEMBER)).toBe(false);
  });

  it('member has viewer privilege', () => {
    expect(hasRole(ROLES.MEMBER, ROLES.VIEWER)).toBe(true);
    expect(hasRole(ROLES.MEMBER, ROLES.MEMBER)).toBe(true);
  });

  it('admin has manager privilege', () => {
    expect(hasRole(ROLES.ADMIN, ROLES.MANAGER)).toBe(true);
    expect(hasRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
  });
});
