import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray, IsEnum, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsUUID(4)
  @IsOptional()
  branchId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Roles cannot be empty strings' })
  roleNames!: string[];

  @IsString()
  @IsOptional()
  @IsEnum(['STUDENT', 'GUARDIAN', 'DRIVER', 'STAFF', 'TEACHER'])
  profileType?: 'STUDENT' | 'GUARDIAN' | 'DRIVER' | 'STAFF' | 'TEACHER';

  @IsOptional()
  profileData?: any;
}
