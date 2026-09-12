import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../../common/database/prisma.service';
import type { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        description: true,
        status: true,
        autonomyLevel: true,
        createdAt: true,
      },
    });
  }

  async findById(projectId: string, organizationId: string, requestingUserId: string) {
    await this.verifyOrgMembership(organizationId, requestingUserId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        slug: true,
        websiteUrl: true,
        description: true,
        status: true,
        autonomyLevel: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      // Return 404 rather than 403 to avoid confirming existence
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(
    organizationId: string,
    dto: CreateProjectDto,
    requestingUserId: string,
  ) {
    await this.verifyOrgRole(organizationId, requestingUserId, ['owner', 'admin', 'manager']);

    const slug = await this.generateUniqueSlug(organizationId, dto.name);

    return this.prisma.project.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
        websiteUrl: dto.websiteUrl ?? null,
        description: dto.description ?? null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        description: true,
        status: true,
        autonomyLevel: true,
        createdAt: true,
      },
    });
  }

  async update(
    projectId: string,
    organizationId: string,
    dto: UpdateProjectDto,
    requestingUserId: string,
  ) {
    await this.findById(projectId, organizationId, requestingUserId);
    await this.verifyOrgRole(organizationId, requestingUserId, ['owner', 'admin', 'manager']);

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteUrl: true,
        description: true,
        status: true,
        autonomyLevel: true,
        updatedAt: true,
      },
    });
  }

  async archive(projectId: string, organizationId: string, requestingUserId: string) {
    await this.findById(projectId, organizationId, requestingUserId);
    await this.verifyOrgRole(organizationId, requestingUserId, ['owner', 'admin']);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'archived' },
      select: { id: true, status: true },
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async verifyOrgMembership(organizationId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, inviteStatus: 'accepted' },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    return membership;
  }

  private async verifyOrgRole(
    organizationId: string,
    userId: string,
    allowedRoles: string[],
  ) {
    const membership = await this.verifyOrgMembership(organizationId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to perform this action');
    }

    return membership;
  }

  private async generateUniqueSlug(organizationId: string, name: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true }).substring(0, 40);
    let slug = base;
    let attempt = 0;

    while (true) {
      const existing = await this.prisma.project.findFirst({
        where: { organizationId, slug },
      });
      if (!existing) break;
      attempt++;
      slug = `${base}-${attempt}`;
    }

    return slug;
  }
}
