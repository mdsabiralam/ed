import { Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionSessionsRepository } from './repositories/admission-sessions.repository';
import { CreateAdmissionSessionDto } from './dto/create-admission-session.dto';
import { UpdateAdmissionSessionDto } from './dto/update-admission-session.dto';
import { FilterAdmissionSessionDto } from './dto/filter-admission-session.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionSession } from '@prisma/client';

@Injectable()
export class AdmissionSessionsService {
  constructor(private readonly repository: AdmissionSessionsRepository) {}

  async create(createDto: CreateAdmissionSessionDto, actor: RequestContextUser): Promise<AdmissionSession> {
    return this.repository.create(
      {
        academicSessionId: createDto.academicSessionId,
        name: createDto.name,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        status: createDto.status || 'DRAFT',
      },
      actor,
    );
  }

  async findAll(
    filters: FilterAdmissionSessionDto,
    actor: RequestContextUser,
  ): Promise<{ data: AdmissionSession[]; total: number }> {
    return this.repository.findAll(filters, actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<AdmissionSession> {
    const session = await this.repository.findById(id, actor);
    if (!session) {
      throw new NotFoundException(`Admission Session with ID '${id}' not found`);
    }
    return session;
  }

  async update(
    id: string,
    updateDto: UpdateAdmissionSessionDto,
    actor: RequestContextUser,
  ): Promise<AdmissionSession> {
    const data: any = {};
    if (updateDto.academicSessionId) data.academicSessionId = updateDto.academicSessionId;
    if (updateDto.name) data.name = updateDto.name;
    if (updateDto.startDate) data.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) data.endDate = new Date(updateDto.endDate);
    if (updateDto.status) data.status = updateDto.status;

    return this.repository.update(id, data, actor);
  }

  async remove(id: string, actor: RequestContextUser): Promise<AdmissionSession> {
    return this.repository.softDelete(id, actor);
  }
}
