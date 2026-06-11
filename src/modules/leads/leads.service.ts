import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadsRepository } from './repositories/leads.repository';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { Lead } from '@prisma/client';
import { DuplicateLeadException } from '../../common/exceptions/admission.exceptions';

@Injectable()
export class LeadsService {
  constructor(private readonly repository: LeadsRepository) {}

  async checkDuplicateLead(
    instituteId: string,
    admissionSessionId: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    const dup = await this.repository.findDuplicate(instituteId, admissionSessionId, email, phone);
    if (dup) {
      throw new DuplicateLeadException();
    }
  }

  async create(createDto: CreateLeadDto, actor: RequestContextUser): Promise<Lead> {
    // 1. Run duplicate checks
    await this.checkDuplicateLead(
      actor.instituteId,
      createDto.admissionSessionId,
      createDto.email,
      createDto.phone,
    );

    // 2. Create lead
    return this.repository.create(
      {
        admissionSessionId: createDto.admissionSessionId,
        branchId: createDto.branchId || actor.branchId,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        email: createDto.email || null,
        phone: createDto.phone || null,
        className: createDto.className || null,
        status: createDto.status || 'NEW',
        source: createDto.source || 'WEBSITE',
        notes: createDto.notes || null,
      },
      actor,
    );
  }

  async findAll(filters: FilterLeadDto, actor: RequestContextUser): Promise<{ data: Lead[]; total: number }> {
    return this.repository.findAll(filters, actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<Lead> {
    const lead = await this.repository.findById(id, actor);
    if (!lead) {
      throw new NotFoundException(`Lead with ID '${id}' not found or you do not have access to it`);
    }
    return lead;
  }

  async update(id: string, updateDto: UpdateLeadDto, actor: RequestContextUser): Promise<Lead> {
    const existing = await this.findOne(id, actor);

    // If email or phone are changing, check duplicates
    const emailChanged = updateDto.email && updateDto.email !== existing.email;
    const phoneChanged = updateDto.phone && updateDto.phone !== existing.phone;

    if (emailChanged || phoneChanged) {
      await this.checkDuplicateLead(
        actor.instituteId,
        updateDto.admissionSessionId || existing.admissionSessionId,
        updateDto.email || existing.email || undefined,
        updateDto.phone || existing.phone || undefined,
      );
    }

    const data: any = {};
    if (updateDto.admissionSessionId) data.admissionSessionId = updateDto.admissionSessionId;
    if (updateDto.branchId !== undefined) data.branchId = updateDto.branchId;
    if (updateDto.firstName) data.firstName = updateDto.firstName;
    if (updateDto.lastName) data.lastName = updateDto.lastName;
    if (updateDto.email !== undefined) data.email = updateDto.email;
    if (updateDto.phone !== undefined) data.phone = updateDto.phone;
    if (updateDto.className !== undefined) data.className = updateDto.className;
    if (updateDto.status) data.status = updateDto.status;
    if (updateDto.source !== undefined) data.source = updateDto.source;
    if (updateDto.notes !== undefined) data.notes = updateDto.notes;

    return this.repository.update(id, data, actor);
  }

  async remove(id: string, actor: RequestContextUser): Promise<Lead> {
    return this.repository.softDelete(id, actor);
  }
}
