import { Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionFormTemplatesRepository } from './repositories/admission-form-templates.repository';
import { CreateAdmissionFormTemplateDto } from './dto/create-admission-form-template.dto';
import { UpdateAdmissionFormTemplateDto } from './dto/update-admission-form-template.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionFormTemplate } from '@prisma/client';

@Injectable()
export class AdmissionFormTemplatesService {
  constructor(private readonly repository: AdmissionFormTemplatesRepository) {}

  async createTemplate(createDto: CreateAdmissionFormTemplateDto, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.repository.create(
      {
        name: createDto.name,
        className: createDto.className,
        isActive: createDto.isActive !== undefined ? createDto.isActive : true,
        version: 1,
        formFieldsJson: createDto.formFieldsJson,
      },
      actor,
    );
  }

  async updateTemplate(
    id: string,
    updateDto: UpdateAdmissionFormTemplateDto,
    actor: RequestContextUser,
  ): Promise<AdmissionFormTemplate> {
    const data: any = {};
    if (updateDto.name) data.name = updateDto.name;
    if (updateDto.className) data.className = updateDto.className;
    if (updateDto.isActive !== undefined) data.isActive = updateDto.isActive;
    if (updateDto.formFieldsJson) {
      data.formFieldsJson = updateDto.formFieldsJson;
      // Increment template version on layout edits
      data.version = { increment: 1 };
    }

    return this.repository.update(id, data, actor);
  }

  async activateTemplate(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.repository.setActiveState(id, true, actor);
  }

  async deactivateTemplate(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.repository.setActiveState(id, false, actor);
  }

  async findAll(actor: RequestContextUser): Promise<AdmissionFormTemplate[]> {
    return this.repository.findAll(actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    const template = await this.repository.findById(id, actor);
    if (!template) {
      throw new NotFoundException(`Admission Form Template with ID '${id}' not found`);
    }
    return template;
  }

  async remove(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.repository.softDelete(id, actor);
  }
}
