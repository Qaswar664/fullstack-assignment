import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { successResponse } from 'src/common/helpers/response.helper';
import { Role } from '@prisma/client';
import { AssignCustomerDto } from './dto/assign-customer.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or no organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Customer email already exists in organization' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Body() dto: CreateCustomerDto,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.customersService.create(dto, organizationId!, userId);
    return successResponse('Customer created successfully', data, 201);
  }

  // ─── List (pagination + search) ──────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'includeDeleted', required: false, example: false, description: 'Include soft-deleted customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findAll(
    @GetUser('organizationId') organizationId: string | null,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    this.ensureHasOrg(organizationId);
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const data = await this.customersService.findAll(
      organizationId!,
      safePage,
      safeLimit,
      search,
      includeDeleted === 'true',
    );
    return successResponse('Customers retrieved successfully', data);
  }

  // ─── Find One ────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findOne(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.customersService.findOne(id, organizationId!);
    return successResponse('Customer retrieved successfully', data);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 400, description: 'No fields provided or no organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 409, description: 'Email already exists in organization' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async update(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.customersService.update(id, organizationId!, dto, userId);
    return successResponse('Customer updated successfully', data);
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async remove(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.customersService.remove(id, organizationId!, userId);
    return successResponse('Customer deleted successfully', data);
  }

  // ─── Restore ─────────────────────────────────────────────────────────────

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer restored successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Deleted customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async restore(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.customersService.restore(id, organizationId!, userId);
    return successResponse('Customer restored successfully', data);
  }

  // ─── Permanent Delete (admin only) ──────────────────────────────────────

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Permanently delete a soft-deleted customer (admin only)' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer permanently deleted' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Deleted customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async permanentDelete(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
  ) {
    this.ensureHasOrg(organizationId);
    await this.customersService.permanentDelete(id, organizationId!);
    return successResponse('Customer permanently deleted', null);
  }

  // ─── Assign / Unassign ───────────────────────────────────────────────────

  @Patch(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign or unassign a customer to a user',
    description: 'Send `assignedToId` with a user UUID to assign, or `null` to unassign.',
  })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer assigned/unassigned successfully' })
  @ApiResponse({ status: 400, description: 'No organization, user not in org, or user already has 5 active customers assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async assign(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
    @Body() dto: AssignCustomerDto,
  ) {
    this.ensureHasOrg(organizationId);
    const assignedToId = dto.assignedToId ?? null;
    const data = await this.customersService.assign(id, organizationId!, assignedToId, userId);
    const message = assignedToId
      ? 'Customer assigned successfully'
      : 'Customer unassigned successfully';
    return successResponse(message, data);
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
