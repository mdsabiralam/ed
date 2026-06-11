import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Lead, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';
import { FilterLeadDto } from '../dto/filter-lead.dto';

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getBranchScope(actor: RequestContextUser): Prisma.LeadWhereInput {
    // SUPER_ADMIN has global access (handled via RLS bypass or no institute/branch constraint)
    if (actor.roles.includes('SUPER_ADMIN')) {
      return {};
    }

    const branchRestrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
    const isRestricted = actor.roles.some((r) => branchRestrictedRoles.includes(r));

    if (isRestricted) {
      // Must match their own branch and cannot access HQ/null records or other branches
      return {
        branchId: actor.branchId || '00000000-0000-0000-0000-000000000000',
      };
    }

    // INSTITUTE_OWNER and PRINCIPAL have access to all branches inside their instituteId
    return {};
  }

  async create(
    data: Omit<Prisma.LeadUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<Lead> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.lead.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<Lead | null> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.lead.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...branchScope,
          },
        });
      },
    );
  }

  async findDuplicate(
    instituteId: string,
    admissionSessionId: string,
    email?: string,
    phone?: string,
  ): Promise<Lead | null> {
    // Bypass context for pre-save duplicate validations globally inside session
    if (!email && !phone) return null;
    const conditions: Prisma.LeadWhereInput[] = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    return this.prisma.lead.findFirst({
      where: {
        instituteId,
        admissionSessionId,
        deletedAt: null,
        OR: conditions,
      },
    });
  }

  async findAll(
    filters: FilterLeadDto,
    actor: RequestContextUser,
  ): Promise<{ data: Lead[]; total: number }> {
    const { status, admissionSessionId, branchId, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const branchScope = this.getBranchScope(actor);

    const where: Prisma.LeadWhereInput = {
      instituteId: actor.instituteId,
      deletedAt: null,
      ...branchScope,
    };

    if (status) {
      where.status = status;
    }

    if (admissionSessionId) {
      where.admissionSessionId = admissionSessionId;
    }

    // BranchId query parameter is only applied if branchScope does not override it
    if (branchId && !branchScope.branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const [data, total] = await Promise.all([
          tx.lead.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          tx.lead.count({ where }),
        ]);
        return { data, total };
      },
    );
  }

  async update(id: string, data: Prisma.LeadUncheckedUpdateInput, actor: RequestContextUser): Promise<Lead> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.lead.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Lead with ID '${id}' not found or you do not have access to it`);
        }

        return tx.lead.update({
          where: { id },
          data,
        });
      },
    );
  }

  async softDelete(id: string, actor: RequestContextUser): Promise<Lead> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.lead.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Lead with ID '${id}' not found or you do not have access to it`);
        }

        return tx.lead.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: actor.userId,
          },
        });
      },
    );
  }
}
