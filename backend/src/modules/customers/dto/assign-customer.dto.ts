import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AssignCustomerDto {
  @ApiPropertyOptional({
    example: 'uuid-of-user',
    description: 'User ID to assign. Send null or omit to unassign.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'assignedToId must be a valid UUID' })
  assignedToId?: string | null;
}
