import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsDateString, IsOptional } from 'class-validator';

export class ConvertLeadDto {
  @ApiProperty({ example: '2018-05-15', description: 'Date of birth of the candidate' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender of the candidate' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'Robert', description: 'First name of the guardian' })
  @IsString()
  @IsNotEmpty()
  guardianFirstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the guardian' })
  @IsString()
  @IsNotEmpty()
  guardianLastName: string;

  @ApiProperty({ example: 'robert.doe@example.com', description: 'Email address of the guardian' })
  @IsEmail()
  @IsNotEmpty()
  guardianEmail: string;

  @ApiProperty({ example: '+1234567891', description: 'Phone number of the guardian' })
  @IsString()
  @IsNotEmpty()
  guardianPhone: string;

  @ApiProperty({ example: 'FATHER', description: 'Relation of the guardian to candidate' })
  @IsString()
  @IsNotEmpty()
  guardianRelation: string;

  @ApiPropertyOptional({ example: 'Engineer', description: 'Occupation of the guardian' })
  @IsString()
  @IsOptional()
  guardianOccupation?: string;
}
