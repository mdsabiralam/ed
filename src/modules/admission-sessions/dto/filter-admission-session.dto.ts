import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdmissionSessionStatus } from '@prisma/client';

export class FilterAdmissionSessionDto {
  @ApiPropertyOptional({ enum: AdmissionSessionStatus, description: 'Filter by session status' })
  @IsEnum(AdmissionSessionStatus)
  @IsOptional()
  status?: AdmissionSessionStatus;

  @ApiPropertyOptional({ example: '2026', description: 'Search term for session name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Page size limit' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
