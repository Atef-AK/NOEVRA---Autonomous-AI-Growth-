import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../../common/database/prisma.service';
import type { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(organizationId: string, requestingUserId: string) {
    // Verify the user is a member
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: requestingUserId,
        inviteStatus: 'accepted',
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        logoUrl: true,
        createdAt: true,
      },
    });
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, inviteStatus: 'accepted' },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            logoUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async create(dto: CreateOrganizationDto, ownerId: string) {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.name, slug },
      });

      await tx.organizationMember.create({
        data: {
          userId: ownerId,
          organizationId: org.id,
          role: 'owner',
          inviteStatus: 'accepted',
          joinedAt: new Date(),
        },
      });

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        logoUrl: org.logoUrl,
        createdAt: org.createdAt,
      };
    });
  }

  async update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    requestingUserId: string,
  ) {
    // Only owner/admin can update
    await this.requireRole(organizationId, requestingUserId, ['owner', 'admin']);

    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        logoUrl: true,
        updatedAt: true,
      },
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  async requireRole(
    organizationId: string,
    userId: string,
    allowedRoles: string[],
  ): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, inviteStatus: 'accepted' },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  async isMember(organizationId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.organizationMember.count({
      where: { organizationId, userId, inviteStatus: 'accepted' },
    });
    return count > 0;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true }).substring(0, 40);
    let slug = base;
    let attempt = 0;

    while (true) {
      const existing = await this.prisma.organization.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${base}-${attempt}`;
    }

    return slug;
  }
}
