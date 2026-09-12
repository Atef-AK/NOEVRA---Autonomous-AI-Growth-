/**
 * Organization member roles.
 * Ordered from most privileged to least.
 */
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Ordered hierarchy — index 0 = most privileged */
export const ROLE_HIERARCHY: Role[] = [
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.MEMBER,
  ROLES.VIEWER,
];

/**
 * Returns true if `actorRole` has at least the privilege level of `requiredRole`.
 */
export function hasRole(actorRole: Role, requiredRole: Role): boolean {
  const actorIndex = ROLE_HIERARCHY.indexOf(actorRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  // Lower index = more privileged
  return actorIndex !== -1 && actorIndex <= requiredIndex;
}
