import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Customer called to follow up on the proposal.',
    description: 'Note content',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(2000, { message: 'Note content cannot exceed 2000 characters' })
  content: string;
}
