import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreateInstituteDto {
  @IsString()
  @IsNotEmpty({ message: 'Institute name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Subdomain is required' })
  subdomain!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsUUID(4, { message: 'Plan ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Plan ID is required' })
  planId!: string;

  @IsEmail({}, { message: 'Please provide a valid administrator email' })
  @IsNotEmpty({ message: 'Admin email is required' })
  adminEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin first name is required' })
  adminFirstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin last name is required' })
  adminLastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Admin password is required' })
  @MinLength(6, { message: 'Admin password must be at least 6 characters long' })
  adminPassword!: string;
}
