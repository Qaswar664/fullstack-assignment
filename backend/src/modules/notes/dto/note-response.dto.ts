import { ApiProperty } from '@nestjs/swagger';

export class NoteCreatedByDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Jane Smith' })
  name: string;

  @ApiProperty({ example: 'jane@acme.com' })
  email: string;
}

export class NoteResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Customer called to follow up on the proposal.' })
  content: string;

  @ApiProperty({ example: 'customer-uuid-here' })
  customerId: string;

  @ApiProperty({ example: 'org-uuid-here' })
  organizationId: string;

  @ApiProperty({ example: 'user-uuid-here' })
  createdById: string;

  @ApiProperty({ type: NoteCreatedByDto })
  createdBy: NoteCreatedByDto;

  @ApiProperty()
  createdAt: Date;
}

export class NotesListResponseDto {
  @ApiProperty({ type: [NoteResponseDto] })
  data: NoteResponseDto[];

  @ApiProperty({ example: 3 })
  total: number;
}
