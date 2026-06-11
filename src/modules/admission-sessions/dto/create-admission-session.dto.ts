import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AdmissionSessionStatus } from '@prisma/client';

export class CreateAdmissionSessionDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Academic Session UUID' })
  @IsUUID()
  @IsNotEmpty()
  academicSessionId: string;

  @ApiProperty({ example: 'Admission Session 2026-2027', description: 'Name of the admission cycle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-06-01', description: 'Start date of the admission intake' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-09-30', description: 'End date of the admission intake' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ enum: AdmissionSessionStatus, default: AdmissionSessionStatus.DRAFT, description: 'Intake lifecycle status' })
  @IsEnum(AdmissionSessionStatus)
  @IsOptional()
  status?: AdmissionSessionStatus;
}
