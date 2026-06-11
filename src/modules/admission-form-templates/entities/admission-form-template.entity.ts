import { ApiProperty } from '@nestjs/swagger';
import { AdmissionFormTemplate } from '@prisma/client';

export class AdmissionFormTemplateEntity implements AdmissionFormTemplate {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  instituteId: string;

  @ApiProperty({ example: 'Class 5 Form Layout' })
  name: string;

  @ApiProperty({ example: 'Class 5' })
  className: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({
    example: [
      { name: 'previousSchool', type: 'text', required: true, label: 'Previous School Name' }
    ]
  })
  formFieldsJson: any;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-11T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ example: null, nullable: true })
  deletedBy: string | null;
}
