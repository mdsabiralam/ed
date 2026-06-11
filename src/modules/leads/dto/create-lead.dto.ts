import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Admission Session UUID' })
  @IsUUID()
  @IsNotEmpty()
  admissionSessionId: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', description: 'Branch UUID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'John', description: 'First name of candidate' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of candidate' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'johndoe@example.com', description: 'Email address of candidate/parent' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Class 5', description: 'Target class' })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW, description: 'Current pipeline status of lead' })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ example: 'WEBSITE', description: 'Source channel of inquiry' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Wants transport option details', description: 'Counseling or source notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
