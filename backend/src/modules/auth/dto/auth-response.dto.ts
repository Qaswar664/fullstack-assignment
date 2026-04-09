import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserInAuthDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@acme.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.admin })
  role: Role;

  @ApiPropertyOptional({ example: 'org-uuid-here', nullable: true })
  organizationId: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGci...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGci...' })
  refreshToken: string;

  @ApiProperty({ type: UserInAuthDto })
  user: UserInAuthDto;
}
