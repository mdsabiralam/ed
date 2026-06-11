import { ApiProperty } from '@nestjs/swagger';
import { LeadFollowup } from '@prisma/client';

export class LeadFollowupEntity implements LeadFollowup {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  leadId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14' })
  followedUpBy: string;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  followUpDate: Date;

  @ApiProperty({ example: '2026-06-18T12:00:00.000Z', nullable: true })
  nextFollowUpDate: Date | null;

  @ApiProperty({ example: 'CALL' })
  mode: string;

  @ApiProperty({ example: 'Parent requested callback next Monday', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;
}
