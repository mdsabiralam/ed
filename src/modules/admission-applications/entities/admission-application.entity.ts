import { ApiProperty } from '@nestjs/swagger';
import { AdmissionApplication, ApplicationStatus } from '@prisma/client';

export class AdmissionApplicationEntity implements AdmissionApplication {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  branchId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', nullable: true })
  leadId: string | null;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15' })
  admissionSessionId: string;

  @ApiProperty({ example: 'APP-2026-000001' })
  applicationNumber: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'johndoe@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+1234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ example: '2018-05-15T00:00:00.000Z' })
  dateOfBirth: Date;

  @ApiProperty({ example: 'Male', nullable: true })
  gender: string | null;

  @ApiProperty({ example: 'Class 5' })
  className: string;

  @ApiProperty({ example: 'Section A', nullable: true })
  sectionName: string | null;

  @ApiProperty({ example: 'Robert' })
  guardianFirstName: string;

  @ApiProperty({ example: 'Doe' })
  guardianLastName: string;

  @ApiProperty({ example: 'robert.doe@example.com' })
  guardianEmail: string;

  @ApiProperty({ example: '+1234567891' })
  guardianPhone: string;

  @ApiProperty({ example: 'FATHER' })
  guardianRelation: string;

  @ApiProperty({ example: 'Engineer', nullable: true })
  guardianOccupation: string | null;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', nullable: true })
  guardianId: string | null;

  @ApiProperty({ enum: ApplicationStatus, example: ApplicationStatus.SUBMITTED })
  status: ApplicationStatus;

  @ApiProperty({ example: null, nullable: true })
  waitlistNumber: number | null;

  @ApiProperty({ example: false })
  isReserved: boolean;

  @ApiProperty({ example: { previousSchool: 'St. Mary School' }, nullable: true })
  customFieldsJson: any;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  deletedBy: string | null;
}
