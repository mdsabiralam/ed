import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadFollowupsRepository } from './repositories/lead-followups.repository';
import { CreateLeadFollowupDto } from './dto/create-lead-followup.dto';
import { UpdateLeadFollowupDto } from './dto/update-lead-followup.dto';
import { FilterLeadFollowupDto } from './dto/filter-lead-followup.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { LeadFollowup } from '@prisma/client';

@Injectable()
export class LeadFollowupsService {
  constructor(private readonly repository: LeadFollowupsRepository) {}

  async create(createDto: CreateLeadFollowupDto, actor: RequestContextUser): Promise<LeadFollowup> {
    return this.repository.create(
      {
        leadId: createDto.leadId,
        followedUpBy: actor.userId,
        followUpDate: createDto.followUpDate ? new Date(createDto.followUpDate) : new Date(),
        nextFollowUpDate: createDto.nextFollowUpDate ? new Date(createDto.nextFollowUpDate) : null,
        mode: createDto.mode || 'CALL',
        notes: createDto.notes || null,
      },
      actor,
    );
  }

  async findAll(
    filters: FilterLeadFollowupDto,
    actor: RequestContextUser,
  ): Promise<{ data: LeadFollowup[]; total: number }> {
    return this.repository.findAll(filters, actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<LeadFollowup> {
    const followup = await this.repository.findById(id, actor);
    if (!followup) {
      throw new NotFoundException(`Lead Follow-up with ID '${id}' not found or you do not have access to it`);
    }
    return followup;
  }

  async update(
    id: string,
    updateDto: UpdateLeadFollowupDto,
    actor: RequestContextUser,
  ): Promise<LeadFollowup> {
    const data: any = {};
    if (updateDto.leadId) data.leadId = updateDto.leadId;
    if (updateDto.followUpDate) data.followUpDate = new Date(updateDto.followUpDate);
    if (updateDto.nextFollowUpDate !== undefined) {
      data.nextFollowUpDate = updateDto.nextFollowUpDate ? new Date(updateDto.nextFollowUpDate) : null;
    }
    if (updateDto.mode) data.mode = updateDto.mode;
    if (updateDto.notes !== undefined) data.notes = updateDto.notes;

    return this.repository.update(id, data, actor);
  }

  async remove(id: string, actor: RequestContextUser): Promise<LeadFollowup> {
    return this.repository.delete(id, actor);
  }
}
