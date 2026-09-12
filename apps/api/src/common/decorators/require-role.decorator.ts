import { SetMetadata } from '@nestjs/common';
import { Role } from '@growthos/shared';

export const ROLES_KEY = 'roles';

/**
 * Require specific role(s) on a route.
 * Usage: @RequireRole('admin', 'owner')
 */
export const RequireRole = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
