import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../common/database/prisma.service';
import { hasRole, ROLES, type Role } from '@growthos/shared';
import type { InviteMemberDto, UpdateMemberRoleDto } from './dto/member.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, requestingUserId: string) {
    await this.verifyMembership(organizationId, requestingUserId);

    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true, emailVerified: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async invite(
    organizationId: string,
    dto: InviteMemberDto,
    invitedByUserId: string,
  ) {
    // Verify inviter has permission (admin or higher)
    const inviterMembership = await this.verifyRole(
      organizationId,
      invitedByUserId,
      ['owner', 'admin'],
    );

    // Can't invite with higher role than yourself
    if (!hasRole(inviterMembership.role as Role, dto.role)) {
      throw new ForbiddenException('Cannot invite with a higher role than your own');
    }

    // Check if user already has a membership or pending invite
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.organizationMember.findFirst({
        where: { organizationId, userId: existingUser.id },
      });

      if (existingMembership?.inviteStatus === 'accepted') {
        throw new ConflictException('User is already a member of this organization');
      }

      if (existingMembership?.inviteStatus === 'pending') {
        throw new ConflictException('User already has a pending invitation');
      }
    }

    // Generate invite token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    if (existingUser) {
      // User exists — create membership directly
      const member = await this.prisma.organizationMember.create({
        data: {
          organizationId,
          userId: existingUser.id,
          role: dto.role,
          invitedByUserId,
          inviteEmail: dto.email.toLowerCase(),
          inviteToken: tokenHash, // use hash as token for simplicity
          inviteStatus: 'pending',
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      });

      this.logger.log(`Invite sent to ${dto.email} (existing user) for org ${organizationId}`);
      return { member, inviteToken: rawToken };
    } else {
      // User doesn't exist yet — placeholder (invite by email flow)
      // For now, log the token. In production this sends an email with registration + auto-join link.
      this.logger.log(
        `Invite token for ${dto.email} to join org ${organizationId}: ${rawToken}`,
      );

      return {
        inviteToken: rawToken,
        message: `Invitation sent to ${dto.email}. They will receive an email with instructions.`,
      };
    }
  }

  async acceptInvite(token: string, userId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        OR: [{ inviteToken: tokenHash }, { inviteToken: token }],
        inviteStatus: 'pending',
      },
    });

    if (!membership) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    // Check it matches the user
    if (membership.userId !== userId) {
      throw new ForbiddenException('Invitation was sent to a different user');
    }

    return this.prisma.organizationMember.update({
      where: { id: membership.id },
      data: {
        inviteStatus: 'accepted',
        joinedAt: new Date(),
        inviteToken: null,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requestingUserId: string,
  ) {
    const requesterMembership = await this.verifyRole(organizationId, requestingUserId, [
      'owner',
      'admin',
    ]);

    const targetMembership = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    // Can't change own role
    if (targetMembership.userId === requestingUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    // Can't change owner role
    if (targetMembership.role === ROLES.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Can't assign higher role than own
    if (!hasRole(requesterMembership.role as Role, dto.role)) {
      throw new ForbiddenException('Cannot assign a role higher than your own');
    }

    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async remove(
    organizationId: string,
    memberId: string,
    requestingUserId: string,
  ) {
    await this.verifyRole(organizationId, requestingUserId, ['owner', 'admin']);

    const membership = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.userId === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    if (membership.role === ROLES.OWNER) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    await this.prisma.organizationMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async verifyMembership(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, inviteStatus: 'accepted' },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return membership;
  }

  private async verifyRole(
    organizationId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const membership = await this.verifyMembership(organizationId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }
}
