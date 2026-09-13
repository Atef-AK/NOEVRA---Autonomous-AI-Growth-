import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { PrismaService } from '../../common/database/prisma.service';
import { getEnv } from '@growthos/config';
import { ALL_SPECIALIZED_AGENTS } from '@growthos/agent-sdk';
import type { JwtPayload } from './strategies/jwt.strategy';
import type {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/auth.dto';

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly env = getEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================================
  // REGISTRATION
  // ============================================================

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user + personal organization in a transaction
    const { user, organization, member } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name ?? null,
        },
      });

      // Create personal organization (workspace)
      const orgName = dto.name ? `${dto.name}'s Workspace` : 'My Workspace';
      const orgSlug = await this.generateUniqueSlug(tx, orgName);

      const newOrg = await tx.organization.create({
        data: { name: orgName, slug: orgSlug },
      });

      const newMember = await tx.organizationMember.create({
        data: {
          userId: newUser.id,
          organizationId: newOrg.id,
          role: 'owner',
          inviteStatus: 'accepted',
          joinedAt: new Date(),
        },
      });

      // Provision all 13 canonical specialized agents for the new workspace
      for (const agentDef of ALL_SPECIALIZED_AGENTS) {
        await tx.agent.create({
          data: {
            organizationId: newOrg.id,
            name: agentDef.name,
            slug: agentDef.slug,
            description: agentDef.description,
            systemPrompt: agentDef.systemPrompt,
            allowedTools: agentDef.allowedTools as any,
            preferredModel: getOptimalModel('high'),
            maxSteps: agentDef.maxSteps,
            maxTokens: agentDef.maxTokens,
            temperatureX10: agentDef.temperatureX10,
            isActive: true,
          },
        });
      }

      // Provision primary company brain
      await tx.companyBrain.create({
        data: {
          organizationId: newOrg.id,
          name: 'Primary Brain',
          summary: `${orgName} knowledge base and growth directives.`,
          brandVoice: 'Authoritative, clear, engineering-grade, data-driven.',
          targetAudience: 'Prospective buyers and ideal customer profile leads.',
          valueProps: ['Autonomous multi-agent execution', 'Continuous attribution', 'Zero-friction growth'],
          competitors: [],
          positioning: 'Autonomous AI Growth Platform',
          version: 1,
        },
      });

      return { user: newUser, organization: newOrg, member: newMember };
    });

    // Issue email verification token (non-blocking in dev — just log)
    await this.issueEmailVerification(user.email);

    // Issue auth tokens
    const tokens = await this.issueTokens(user.id, user.email, organization.id, member.role);

    this.logger.log(`User registered: ${user.email} org: ${organization.slug}`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingattackprotection');
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Failed login attempt for ${user.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get primary organization membership
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id, inviteStatus: 'accepted' },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (!membership) {
      throw new UnauthorizedException('No active organization membership');
    }

    const tokens = await this.issueTokens(
      user.id,
      user.email,
      membership.organizationId,
      membership.role,
      ipAddress,
      userAgent,
    );

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    };
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // If token was already used/revoked, revoke entire family (rotation attack detection)
      if (storedToken?.family) {
        await this.revokeTokenFamily(storedToken.family);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the used token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Get current organization membership
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: storedToken.userId, inviteStatus: 'accepted' },
      orderBy: { joinedAt: 'asc' },
    });

    if (!membership) {
      throw new UnauthorizedException('No active organization membership');
    }

    // Issue new tokens in the same family
    return this.issueTokens(
      storedToken.userId,
      storedToken.user.email,
      membership.organizationId,
      membership.role,
      storedToken.ipAddress ?? undefined,
      storedToken.userAgent ?? undefined,
      storedToken.family,
    );
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(userId: string): Promise<void> {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { email: record.email },
        data: { emailVerified: true },
      }),
    ]);
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    // Always return success to prevent user enumeration
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    await this.prisma.passwordResetToken.create({
      data: {
        email: user.email,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // In dev: log the token; in production: send email
    this.logger.log(`Password reset token for ${user.email}: ${token}`);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      // Revoke all refresh tokens after password reset
      this.prisma.refreshToken.updateMany({
        where: {
          user: { email: record.email },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private async issueTokens(
    userId: string,
    email: string,
    orgId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string,
    existingFamily?: string,
  ): Promise<AuthTokens> {
    const env = this.env;

    const payload: JwtPayload = { sub: userId, email, orgId, role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    });

    // Refresh token
    const rawRefreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const tokenHash = this.hashToken(rawRefreshToken);
    const family = existingFamily ?? uuidv4();
    const expiresAt = new Date(
      Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async revokeTokenFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueEmailVerification(email: string): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    await this.prisma.emailVerificationToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // In development: log the verification link
    // In production: send via email provider
    this.logger.log(
      `Email verification token for ${email}: ${token}`,
    );
  }

  private async generateUniqueSlug(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    name: string,
  ): Promise<string> {
    const base = slugify(name, { lower: true, strict: true }).substring(0, 40);
    let slug = base;
    let attempt = 0;

    while (true) {
      const existing = await tx.organization.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${base}-${attempt}`;
    }

    return slug;
  }
}
