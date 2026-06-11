import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAdmissionDocumentDto } from './create-admission-document.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentVerificationStatus } from '@prisma/client';

export class UpdateAdmissionDocumentDto extends PartialType(CreateAdmissionDocumentDto) {
  @ApiPropertyOptional({ enum: DocumentVerificationStatus, description: 'Evaluation verification state' })
  @IsEnum(DocumentVerificationStatus)
  @IsOptional()
  verificationStatus?: DocumentVerificationStatus;

  @ApiPropertyOptional({ example: 'Signature not clear', description: 'Rejection reason log if rejected' })
  @IsString()
  @IsOptional()
  rejectedReason?: string;
}
