import { ApiProperty } from '@nestjs/swagger';
import { Lead, LeadStatus } from '@prisma/client';

export class LeadEntity implements Lead {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', nullable: true })
  branchId: string | null;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14' })
  admissionSessionId: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'johndoe@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'Class 5', nullable: true })
  className: string | null;

  @ApiProperty({ enum: LeadStatus, example: LeadStatus.NEW })
  status: LeadStatus;

  @ApiProperty({ example: 'WEBSITE', nullable: true })
  source: string | null;

  @ApiProperty({ example: 'Wants transport option details', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  deletedBy: string | null;
}
