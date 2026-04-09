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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { successResponse } from 'src/common/helpers/response.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or no organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser('organizationId') organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new BadRequestException(
        'You must create an organization before adding users.',
      );
    }
    const data = await this.usersService.create(createUserDto, organizationId);
    return successResponse('User created successfully', data, 201);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users in the organization' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findAll(@GetUser('organizationId') organizationId: string | null) {
    if (!organizationId) {
      throw new BadRequestException(
        'You must belong to an organization to view users.',
      );
    }
    const data = await this.usersService.findAll(organizationId);
    return successResponse('Users retrieved successfully', data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by ID (own org only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findOne(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new BadRequestException(
        'You must belong to an organization to view users.',
      );
    }
    const data = await this.usersService.findOne(id, organizationId);
    return successResponse('User retrieved successfully', data);
  }

  @Patch(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'No fields provided or no organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async update(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @Body() dto: UpdateUserDto,
  ) {
    if (!organizationId) {
      throw new BadRequestException(
        'You must belong to an organization to update users.',
      );
    }
    const data = await this.usersService.update(id, organizationId, dto);
    return successResponse('User updated successfully', data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to any organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete own account or non-admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async remove(
    @Param('id') id: string,
    @GetUser('organizationId') organizationId: string | null,
    @GetUser('id') requestingUserId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException(
        'You must belong to an organization to delete users.',
      );
    }
    await this.usersService.remove(id, organizationId, requestingUserId);
    return successResponse('User deleted successfully', null);
  }
}
