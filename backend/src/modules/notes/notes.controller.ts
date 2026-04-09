import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { successResponse } from 'src/common/helpers/response.helper';
import { CreateNoteDto } from './dto/create-note.dto';
import { NotesListResponseDto, NoteResponseDto } from './dto/note-response.dto';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('customers/:customerId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a note to a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 201, description: 'Note added successfully', type: NoteResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or no organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateNoteDto,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.notesService.create(
      customerId,
      organizationId!,
      userId,
      dto,
    );
    return successResponse('Note added successfully', data, 201);
  }

  // ─── Find All ────────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all notes for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Notes retrieved successfully', type: NotesListResponseDto })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findAll(
    @Param('customerId') customerId: string,
    @GetUser('organizationId') organizationId: string | null,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.notesService.findAll(customerId, organizationId!);
    return successResponse('Notes retrieved successfully', data);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  @Delete(':noteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a note (author or admin only)' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the note author or admin' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async remove(
    @Param('customerId') customerId: string,
    @Param('noteId') noteId: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    await this.notesService.remove(noteId, customerId, organizationId!, userId);
    return successResponse('Note deleted successfully', null);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private ensureHasOrg(organizationId: string | null): void {
    if (!organizationId) {
      throw new BadRequestException(
        'You do not belong to any organization. Please create one first.',
      );
    }
  }
}
