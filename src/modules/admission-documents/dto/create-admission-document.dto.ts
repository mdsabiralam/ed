import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsUrl, IsEnum, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateAdmissionDocumentDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Admission Application UUID' })
  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.BIRTH_CERTIFICATE, description: 'Classified category of document upload' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({ example: 'https://supabase-storage/admissions/birth_cert.pdf', description: 'Secure URL reference of stored file' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}
