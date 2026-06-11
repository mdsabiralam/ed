import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAdmissionApplicationDto } from './create-admission-application.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateAdmissionApplicationDto extends PartialType(CreateAdmissionApplicationDto) {
  @ApiPropertyOptional({ enum: ApplicationStatus, description: 'Update application process state' })
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
