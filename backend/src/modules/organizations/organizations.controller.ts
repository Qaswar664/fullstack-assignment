import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { successResponse } from 'src/common/helpers/response.helper';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new organization (admin only)' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or already in an organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 409, description: 'Organization name already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @GetUser('id') userId: string,
  ) {
    const data = await this.organizationsService.create(dto, userId);
    return successResponse('Organization created successfully', data, 201);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current organization details' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findOne(@GetUser('organizationId') organizationId: string | null) {
    this.ensureHasOrg(organizationId);
    const data = await this.organizationsService.findOne(organizationId!);
    return successResponse('Organization retrieved successfully', data);
  }

  @Patch('me')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update organization name (admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 400, description: 'No fields provided or not in any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 409, description: 'Organization name already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async update(
    @GetUser('organizationId') organizationId: string | null,
    @Body() dto: UpdateOrganizationDto,
  ) {
    this.ensureHasOrg(organizationId);
    const data = await this.organizationsService.update(organizationId!, dto);
    return successResponse('Organization updated successfully', data);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Delete current organization (admin only)' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete org with active customers or not in any org' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async remove(
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') userId: string,
  ) {
    this.ensureHasOrg(organizationId);
    await this.organizationsService.remove(organizationId!, userId);
    return successResponse('Organization deleted successfully', null);
  }

  private ensureHasOrg(organizationId: string | null): void {
    if (!organizationId) {
      throw new BadRequestException(
        'You do not belong to any organization. Please create one first.',
      );
    }
  }
}
