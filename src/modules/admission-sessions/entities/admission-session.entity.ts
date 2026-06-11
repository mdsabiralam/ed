import { ApiProperty } from '@nestjs/swagger';
import { AdmissionSession, AdmissionSessionStatus } from '@prisma/client';

export class AdmissionSessionEntity implements AdmissionSession {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  academicSessionId: string;

  @ApiProperty({ example: 'Admission Session 2026' })
  name: string;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-09-30T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ enum: AdmissionSessionStatus, example: AdmissionSessionStatus.DRAFT })
  status: AdmissionSessionStatus;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  deletedBy: string | null;
}
