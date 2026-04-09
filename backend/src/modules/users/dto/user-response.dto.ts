import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 'jane@acme.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.member })
  role: Role;

  @ApiPropertyOptional({ example: 'org-uuid-here', nullable: true })
  organizationId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
