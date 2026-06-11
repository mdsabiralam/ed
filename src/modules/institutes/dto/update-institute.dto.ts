import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateInstituteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subdomain?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsUUID(4)
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  subscriptionStatus?: string;
}
