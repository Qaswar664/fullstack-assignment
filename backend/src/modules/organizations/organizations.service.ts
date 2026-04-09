import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const ORG_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (user?.organizationId) {
      throw new BadRequestException('You already belong to an organization');
    }

    const existing = await this.prisma.organization.findFirst({
      where: { name: dto.name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An organization with this name already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: dto.name },
        select: ORG_SELECT,
      });

      await tx.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
      });

      this.logger.log(`Organization created: ${org.id} by user: ${userId}`);
      return org;
    });
  }

  async findOne(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        ...ORG_SELECT,
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(organizationId: string, dto: UpdateOrganizationDto) {
    if (!dto.name) {
      throw new BadRequestException('At least one field must be provided to update');
    }

    await this.ensureExists(organizationId);

    const duplicate = await this.prisma.organization.findFirst({
      where: { name: dto.name, NOT: { id: organizationId } },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException('An organization with this name already exists');
    }

    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: dto.name },
      select: ORG_SELECT,
    });

    this.logger.log(`Organization updated: ${organizationId}`);
    return org;
  }

  async remove(organizationId: string, requestingUserId: string) {
    await this.ensureExists(organizationId);

    // Count members excluding the requesting admin themselves
    const otherUsers = await this.prisma.user.count({
      where: { organizationId, NOT: { id: requestingUserId } },
    });

    if (otherUsers > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${otherUsers} other member(s). Please remove all other users first.`,
      );
    }

    const activeCustomers = await this.prisma.customer.count({
      where: { organizationId, deletedAt: null },
    });

    if (activeCustomers > 0) {
      throw new BadRequestException(
        `Cannot delete organization with ${activeCustomers} active customer(s). Please delete all customers first.`,
      );
    }

    await this.prisma.organization.delete({
      where: { id: organizationId },
    });

    this.logger.log(`Organization deleted: ${organizationId}`);
  }

  private async ensureExists(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }
  }
}
