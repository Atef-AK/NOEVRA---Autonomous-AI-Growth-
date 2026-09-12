import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/database/prisma.service';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { getEnv } from '@growthos/config';

export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  orgId: string;      // current organization ID
  role: string;       // role in that organization
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnv().JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Validate the user still exists (prevents token reuse after account deletion)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new Error('User no longer exists');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: payload.orgId,
      role: payload.role,
    };
  }
}
