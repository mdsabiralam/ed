import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateLeadFollowupDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Lead UUID' })
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @ApiPropertyOptional({ example: '2026-06-11T14:00:00.000Z', description: 'Date of this follow-up interaction' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({ example: '2026-06-18T10:00:00.000Z', description: 'Scheduled date for the next callback/interaction' })
  @IsDateString()
  @IsOptional()
  nextFollowUpDate?: string;

  @ApiPropertyOptional({ example: 'CALL', default: 'CALL', description: 'Communication channel (e.g. CALL, EMAIL, VISIT)' })
  @IsString()
  @IsOptional()
  mode?: string;

  @ApiPropertyOptional({ example: 'Parent requested callback next Monday', description: 'Details of discussion' })
  @IsString()
  @IsOptional()
  notes?: string;
}
