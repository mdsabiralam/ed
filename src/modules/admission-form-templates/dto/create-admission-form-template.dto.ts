import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateAdmissionFormTemplateDto {
  @ApiProperty({ example: 'Class 5 Form Layout', description: 'Name of the template' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Class 5', description: 'Class matching this layout' })
  @IsString()
  @IsNotEmpty()
  className: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'True if this is the active layout' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: [
      { name: 'previousSchool', type: 'text', required: true, label: 'Previous School Name' },
      { name: 'percentageObtained', type: 'number', required: false, label: 'Marks Percentage' }
    ],
    description: 'Dynamic schema array containing fields name, type and constraint options'
  })
  @IsArray()
  @IsNotEmpty()
  formFieldsJson: any[];
}
