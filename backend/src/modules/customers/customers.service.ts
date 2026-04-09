import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ActionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  organizationId: true,
  assignedToId: true,
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(dto: CreateCustomerDto, organizationId: string, userId: string) {
    if (dto.assignedToId) {
      await this.ensureUserInOrg(dto.assignedToId, organizationId);
    }

    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.customer.findFirst({
        where: { email: dto.email, organizationId, deletedAt: null },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          'A customer with this email already exists in your organization',
        );
      }

      const customer = await tx.customer.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone ?? null,
          organizationId,
          assignedToId: dto.assignedToId ?? null,
        },
        select: CUSTOMER_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Customer',
          entityId: customer.id,
          action: ActionType.CUSTOMER_CREATED,
          performedById: userId,
          organizationId,
          customerId: customer.id,
        },
      });

      this.logger.log(`Customer created: ${customer.id} in org: ${organizationId}`);
      return customer;
    });
  }

  // ─── Find All (pagination + search) ─────────────────────────────────────

  async findAll(
    organizationId: string,
    page: number,
    limit: number,
    search?: string,
    includeDeleted = false,
  ) {
    const skip = (page - 1) * limit;
    const trimmedSearch = search?.trim() || undefined;

    const where = {
      organizationId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(trimmedSearch
        ? {
            OR: [
              { name: { contains: trimmedSearch, mode: 'insensitive' as const } },
              { email: { contains: trimmedSearch, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [customers, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        select: CUSTOMER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Find One ────────────────────────────────────────────────────────────

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: CUSTOMER_SELECT,
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(
    id: string,
    organizationId: string,
    dto: UpdateCustomerDto,
    userId: string,
  ) {
    if (dto.name === undefined && dto.email === undefined && dto.phone === undefined) {
      throw new BadRequestException('At least one field must be provided to update');
    }

    await this.ensureExists(id, organizationId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.email !== undefined) {
        const duplicate = await tx.customer.findFirst({
          where: { email: dto.email, organizationId, deletedAt: null, NOT: { id } },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException(
            'A customer with this email already exists in your organization',
          );
        }
      }

      const updateData: { name?: string; email?: string; phone?: string | null } = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.phone !== undefined) updateData.phone = dto.phone;

      const customer = await tx.customer.update({
        where: { id },
        data: updateData,
        select: CUSTOMER_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Customer',
          entityId: id,
          action: ActionType.CUSTOMER_UPDATED,
          performedById: userId,
          organizationId,
          customerId: id,
        },
      });

      this.logger.log(`Customer updated: ${id} in org: ${organizationId}`);
      return customer;
    });
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  async remove(id: string, organizationId: string, userId: string) {
    await this.ensureExists(id, organizationId);

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: CUSTOMER_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Customer',
          entityId: id,
          action: ActionType.CUSTOMER_DELETED,
          performedById: userId,
          organizationId,
          customerId: id,
        },
      });

      this.logger.log(`Customer soft-deleted: ${id} in org: ${organizationId}`);
      return customer;
    });
  }

  // ─── Restore (undo soft delete) ──────────────────────────────────────────

  async restore(id: string, organizationId: string, userId: string) {
    const deleted = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: { not: null } },
      select: { id: true },
    });

    if (!deleted) {
      throw new NotFoundException('Deleted customer not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id },
        data: { deletedAt: null },
        select: CUSTOMER_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Customer',
          entityId: id,
          action: ActionType.CUSTOMER_RESTORED,
          performedById: userId,
          organizationId,
          customerId: id,
        },
      });

      this.logger.log(`Customer restored: ${id} in org: ${organizationId}`);
      return customer;
    });
  }

  // ─── Permanent Delete (admin only) ──────────────────────────────────────

  async permanentDelete(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: { not: null } },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(
        'Deleted customer not found. Only soft-deleted customers can be permanently deleted.',
      );
    }

    await this.prisma.customer.delete({ where: { id } });
    this.logger.log(`Customer permanently deleted: ${id} in org: ${organizationId}`);
  }

  // ─── Assign / Unassign ───────────────────────────────────────────────────

  private static readonly MAX_ASSIGNED_CUSTOMERS = 5;

  async assign(
    id: string,
    organizationId: string,
    assignedToId: string | null,
    userId: string,
  ) {
    await this.ensureExists(id, organizationId);

    if (assignedToId) {
      await this.ensureUserInOrg(assignedToId, organizationId);
    }

    return this.prisma.$transaction(async (tx) => {
      // ── Concurrency-safe limit check ─────────────────────────────────────
      // Performed INSIDE the transaction so concurrent requests cannot both
      // pass the check and exceed the limit simultaneously. PostgreSQL's
      // transaction isolation (READ COMMITTED) ensures the count reflects
      // all committed assignments at the time of this read.
      if (assignedToId) {
        const activeCount = await tx.customer.count({
          where: {
            assignedToId,
            organizationId,
            deletedAt: null,
            NOT: { id }, // Exclude the current customer being reassigned
          },
        });

        if (activeCount >= CustomersService.MAX_ASSIGNED_CUSTOMERS) {
          throw new BadRequestException(
            `User already has ${CustomersService.MAX_ASSIGNED_CUSTOMERS} active customers assigned. Unassign one before assigning a new one.`,
          );
        }
      }

      const customer = await tx.customer.update({
        where: { id },
        data: { assignedToId },
        select: CUSTOMER_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Customer',
          entityId: id,
          action: ActionType.CUSTOMER_ASSIGNED,
          performedById: userId,
          organizationId,
          customerId: id,
        },
      });

      this.logger.log(
        `Customer ${id} ${assignedToId ? `assigned to ${assignedToId}` : 'unassigned'} in org: ${organizationId}`,
      );
      return customer;
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async ensureExists(id: string, organizationId: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
  }

  private async ensureUserInOrg(userId: string, organizationId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        'Assigned user does not belong to this organization',
      );
    }
  }
}
