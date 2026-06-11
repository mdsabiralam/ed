import { PartialType } from '@nestjs/swagger';
import { CreateAdmissionFormTemplateDto } from './create-admission-form-template.dto';

export class UpdateAdmissionFormTemplateDto extends PartialType(CreateAdmissionFormTemplateDto) {}
