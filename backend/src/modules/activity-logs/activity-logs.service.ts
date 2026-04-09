import { Injectable } from '@nestjs/common';
import { ActionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const ACTIVITY_LOG_SELECT = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  organizationId: true,
  customerId: true,
  timestamp: true,
  performedBy: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Get all logs for the organization (with optional filters) ───────────

  async findAll(
    organizationId: string,
    page: number,
    limit: number,
    customerId?: string,
    action?: ActionType,
  ) {
    const skip = (page - 1) * limit;
    const trimmedCustomerId = customerId?.trim() || undefined;

    const where = {
      organizationId,
      ...(trimmedCustomerId ? { customerId: trimmedCustomerId } : {}),
      ...(action ? { action } : {}),
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        select: ACTIVITY_LOG_SELECT,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
