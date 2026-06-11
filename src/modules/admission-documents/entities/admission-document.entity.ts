import { ApiProperty } from '@nestjs/swagger';
import { AdmissionDocument, DocumentType, DocumentVerificationStatus } from '@prisma/client';

export class AdmissionDocumentEntity implements AdmissionDocument {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  applicationId: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.BIRTH_CERTIFICATE })
  documentType: DocumentType;

  @ApiProperty({ example: 'https://supabase-storage/admissions/birth_cert.pdf' })
  fileUrl: string;

  @ApiProperty({ enum: DocumentVerificationStatus, example: DocumentVerificationStatus.PENDING })
  verificationStatus: DocumentVerificationStatus;

  @ApiProperty({ example: 'Signature not clear', nullable: true })
  rejectedReason: string | null;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', nullable: true })
  verifiedBy: string | null;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z', nullable: true })
  verifiedAt: Date | null;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  deletedBy: string | null;
}
