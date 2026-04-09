import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType } from '@prisma/client';

export class ActivityLogPerformedByDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 'jane@acme.com' })
  email: string;
}

export class ActivityLogResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Customer' })
  entityType: string;

  @ApiProperty({ example: 'uuid-here' })
  entityId: string;

  @ApiProperty({ enum: ActionType, example: ActionType.CUSTOMER_CREATED })
  action: ActionType;

  @ApiProperty({ example: 'org-uuid-here' })
  organizationId: string;

  @ApiPropertyOptional({ example: 'customer-uuid-here', nullable: true })
  customerId: string | null;

  @ApiProperty({ type: ActivityLogPerformedByDto })
  performedBy: ActivityLogPerformedByDto;

  @ApiProperty()
  timestamp: Date;
}

export class ActivityLogPaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedActivityLogsDto {
  @ApiProperty({ type: [ActivityLogResponseDto] })
  data: ActivityLogResponseDto[];

  @ApiProperty({ type: ActivityLogPaginationMetaDto })
  meta: ActivityLogPaginationMetaDto;
}
