import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-role.decorator';
import { Role, hasRole } from '@growthos/shared';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { Request } from 'express';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No role requirement on this route
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('No user context');
    }

    const actorRole = user.role as Role;
    const allowed = requiredRoles.some((required) => hasRole(actorRole, required));

    if (!allowed) {
      throw new ForbiddenException(
        `Requires one of: [${requiredRoles.join(', ')}]. Your role: ${actorRole}`,
      );
    }

    return true;
  }
}
