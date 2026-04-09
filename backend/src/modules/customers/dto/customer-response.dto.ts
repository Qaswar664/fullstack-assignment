import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedUserDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 'jane@acme.com' })
  email: string;
}

export class CustomerResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'org-uuid-here' })
  organizationId: string;

  @ApiPropertyOptional({ example: 'user-uuid-here', nullable: true })
  assignedToId: string | null;

  @ApiPropertyOptional({ type: AssignedUserDto, nullable: true })
  assignedTo: AssignedUserDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedCustomersDto {
  @ApiProperty({ type: [CustomerResponseDto] })
  data: CustomerResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
