import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ActionType } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { successResponse } from 'src/common/helpers/response.helper';
import { ActivityLogsService } from './activity-logs.service';
import { PaginatedActivityLogsDto } from './dto/activity-log-response.dto';

@ApiTags('activity-logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // ─── Get all logs for the organization ───────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get activity logs for the organization',
    description:
      'Returns paginated activity logs scoped to the current user\'s organization. ' +
      'Optionally filter by customerId or action type.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ActionType,
    description: 'Filter by action type',
  })
  @ApiResponse({ status: 200, description: 'Activity logs retrieved successfully', type: PaginatedActivityLogsDto })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findAll(
    @GetUser('organizationId') organizationId: string | null,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('customerId') customerId?: string,
    @Query('action') action?: ActionType,
  ) {
    this.ensureHasOrg(organizationId);
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));

    const data = await this.activityLogsService.findAll(
      organizationId!,
      safePage,
      safeLimit,
      customerId,
      action,
    );
    return successResponse('Activity logs retrieved successfully', data);
  }

  // ─── Get logs for a specific customer ────────────────────────────────────

  @Get('customer/:customerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get activity logs for a specific customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'Items per page (max 100)' })
  @ApiResponse({ status: 200, description: 'Customer activity logs retrieved successfully', type: PaginatedActivityLogsDto })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findByCustomer(
    @Param('customerId') customerId: string,
    @GetUser('organizationId') organizationId: string | null,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    this.ensureHasOrg(organizationId);
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));

    const data = await this.activityLogsService.findAll(
      organizationId!,
      safePage,
      safeLimit,
      customerId,
    );
    return successResponse('Customer activity logs retrieved successfully', data);
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
