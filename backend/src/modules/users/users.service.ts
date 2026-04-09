import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, organizationId: string) {
    const { name, email, password, role } = createUserDto;

    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { name, email, password: hashedPassword, role, organizationId },
      select: USER_SELECT,
    });

    this.logger.log(`User created: ${user.id} in org: ${organizationId}`);
    return user;
  }

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto) {
    if (dto.name === undefined && dto.email === undefined && dto.role === undefined) {
      throw new BadRequestException('At least one field must be provided to update');
    }

    await this.ensureExists(id, organizationId);

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const updateData: { name?: string; email?: string; role?: UpdateUserDto['role'] } = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    this.logger.log(`User updated: ${id}`);
    return user;
  }

  async remove(id: string, organizationId: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.ensureExists(id, organizationId);

    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User deleted: ${id}`);
  }

  private async ensureExists(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
