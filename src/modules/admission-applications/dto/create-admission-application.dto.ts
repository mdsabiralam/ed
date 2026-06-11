import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsEmail, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateAdmissionApplicationDto {
  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Source Lead ID if converted' })
  @IsUUID()
  @IsOptional()
  leadId?: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', description: 'Admission Session UUID' })
  @IsUUID()
  @IsNotEmpty()
  admissionSessionId: string;

  @ApiProperty({ example: 'John', description: 'First name of the applicant' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the applicant' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'johndoe@example.com', description: 'Email address of applicant' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '2018-05-15', description: 'Date of birth of the applicant' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender of candidate' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Class 5', description: 'Target class' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiPropertyOptional({ example: 'Section A', description: 'Target section' })
  @IsString()
  @IsOptional()
  sectionName?: string;

  @ApiProperty({ example: 'Robert', description: 'Guardian first name' })
  @IsString()
  @IsNotEmpty()
  guardianFirstName: string;

  @ApiProperty({ example: 'Doe', description: 'Guardian last name' })
  @IsString()
  @IsNotEmpty()
  guardianLastName: string;

  @ApiProperty({ example: 'robert.doe@example.com', description: 'Guardian email address' })
  @IsEmail()
  @IsNotEmpty()
  guardianEmail: string;

  @ApiProperty({ example: '+1234567891', description: 'Guardian contact phone number' })
  @IsString()
  @IsNotEmpty()
  guardianPhone: string;

  @ApiProperty({ example: 'FATHER', description: 'Guardian relation to the applicant' })
  @IsString()
  @IsNotEmpty()
  guardianRelation: string;

  @ApiPropertyOptional({ example: 'Software Engineer', description: 'Guardian occupation' })
  @IsString()
  @IsOptional()
  guardianOccupation?: string;

  @ApiPropertyOptional({ example: { previousSchool: 'St. Mary School', percentageObtained: '85' }, description: 'Dynamic form variables matching the template schema' })
  @IsObject()
  @IsOptional()
  customFieldsJson?: Record<string, any>;
}
