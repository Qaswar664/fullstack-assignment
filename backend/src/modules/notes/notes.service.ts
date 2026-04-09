import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ActionType, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';

const NOTE_SELECT = {
  id: true,
  content: true,
  customerId: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  createdBy: {
    select: { id: true, name: true, email: true },
  },
} as const;

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(
    customerId: string,
    organizationId: string,
    userId: string,
    dto: CreateNoteDto,
  ) {
    // Ensure the customer belongs to the org and is not soft-deleted
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          content: dto.content,
          customerId,
          organizationId,
          createdById: userId,
        },
        select: NOTE_SELECT,
      });

      await tx.activityLog.create({
        data: {
          entityType: 'Note',
          entityId: note.id,
          action: ActionType.NOTE_ADDED,
          performedById: userId,
          organizationId,
          customerId,
        },
      });

      this.logger.log(`Note created: ${note.id} on customer: ${customerId}`);
      return note;
    });
  }

  // ─── Find All notes for a customer ───────────────────────────────────────

  async findAll(customerId: string, organizationId: string) {
    // Ensure the customer belongs to the org and is not soft-deleted
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const notes = await this.prisma.note.findMany({
      where: { customerId, organizationId },
      select: NOTE_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return { data: notes, total: notes.length };
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async remove(
    noteId: string,
    customerId: string,
    organizationId: string,
    userId: string,
  ) {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, customerId, organizationId },
      select: { id: true, createdById: true },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Only the note author or an admin can delete a note
    if (note.createdById !== userId) {
      const requestingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (requestingUser?.role !== Role.admin) {
        throw new ForbiddenException(
          'You can only delete your own notes unless you are an admin',
        );
      }
    }

    await this.prisma.note.delete({ where: { id: noteId } });
    this.logger.log(`Note deleted: ${noteId} from customer: ${customerId}`);
  }
}
