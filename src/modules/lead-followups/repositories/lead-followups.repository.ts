import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadFollowup, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';
import { FilterLeadFollowupDto } from '../dto/filter-lead-followup.dto';

@Injectable()
export class LeadFollowupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getBranchScope(actor: RequestContextUser): Prisma.LeadFollowupWhereInput {
    if (actor.roles.includes('SUPER_ADMIN')) {
      return {};
    }

    const branchRestrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
    const isRestricted = actor.roles.some((r) => branchRestrictedRoles.includes(r));

    if (isRestricted) {
      return {
        lead: {
          branchId: actor.branchId || '00000000-0000-0000-0000-000000000000',
        },
      };
    }

    return {};
  }

  async create(
    data: Omit<Prisma.LeadFollowupUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<LeadFollowup> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // Enforce that lead must exist and be accessible under branch/tenant rules
        const restrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
        const isRestricted = actor.roles.some((r) => restrictedRoles.includes(r));
        
        const leadCheck = await tx.lead.findFirst({
          where: {
            id: data.leadId,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...(isRestricted ? { branchId: actor.branchId || '00000000-0000-0000-0000-000000000000' } : {}),
          },
        });

        if (!leadCheck) {
          throw new NotFoundException(`Lead with ID '${data.leadId}' not found or you do not have access to it`);
        }

        return tx.leadFollowup.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<LeadFollowup | null> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.leadFollowup.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            ...branchScope,
          },
        });
      },
    );
  }

  async findAll(
    filters: FilterLeadFollowupDto,
    actor: RequestContextUser,
  ): Promise<{ data: LeadFollowup[]; total: number }> {
    const { leadId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const branchScope = this.getBranchScope(actor);

    const where: Prisma.LeadFollowupWhereInput = {
      instituteId: actor.instituteId,
      ...branchScope,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const [data, total] = await Promise.all([
          tx.leadFollowup.findMany({
            where,
            skip,
            take: limit,
            orderBy: { followUpDate: 'desc' },
          }),
          tx.leadFollowup.count({ where }),
        ]);
        return { data, total };
      },
    );
  }

  async update(
    id: string,
    data: Prisma.LeadFollowupUncheckedUpdateInput,
    actor: RequestContextUser,
  ): Promise<LeadFollowup> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.leadFollowup.findFirst({
          where: { id, instituteId: actor.instituteId, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Lead Follow-up with ID '${id}' not found or you do not have access to it`);
        }

        return tx.leadFollowup.update({
          where: { id },
          data,
        });
      },
    );
  }

  async delete(id: string, actor: RequestContextUser): Promise<LeadFollowup> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.leadFollowup.findFirst({
          where: { id, instituteId: actor.instituteId, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Lead Follow-up with ID '${id}' not found or you do not have access to it`);
        }

        return tx.leadFollowup.delete({
          where: { id },
        });
      },
    );
  }
}
