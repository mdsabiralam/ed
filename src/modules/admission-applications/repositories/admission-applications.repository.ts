import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdmissionApplication, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';
import { FilterAdmissionApplicationDto } from '../dto/filter-admission-application.dto';

@Injectable()
export class AdmissionApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getBranchScope(actor: RequestContextUser): Prisma.AdmissionApplicationWhereInput {
    if (actor.roles.includes('SUPER_ADMIN')) {
      return {};
    }

    const branchRestrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
    const isRestricted = actor.roles.some((r) => branchRestrictedRoles.includes(r));

    if (isRestricted) {
      return {
        branchId: actor.branchId || '00000000-0000-0000-0000-000000000000',
      };
    }

    return {};
  }

  async create(
    data: Omit<Prisma.AdmissionApplicationUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<AdmissionApplication> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionApplication.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<AdmissionApplication | null> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionApplication.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...branchScope,
          },
          include: {
            documents: {
              where: { deletedAt: null },
            },
            entranceExam: {
              where: { deletedAt: null },
            },
            interview: {
              where: { deletedAt: null },
            },
          },
        });
      },
    );
  }

  async findAll(
    filters: FilterAdmissionApplicationDto,
    actor: RequestContextUser,
  ): Promise<{ data: AdmissionApplication[]; total: number }> {
    const { status, admissionSessionId, branchId, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const branchScope = this.getBranchScope(actor);

    const where: Prisma.AdmissionApplicationWhereInput = {
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

    if (branchId && !branchScope.branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { applicationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const [data, total] = await Promise.all([
          tx.admissionApplication.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          tx.admissionApplication.count({ where }),
        ]);
        return { data, total };
      },
    );
  }

  async update(
    id: string,
    data: Prisma.AdmissionApplicationUncheckedUpdateInput,
    actor: RequestContextUser,
  ): Promise<AdmissionApplication> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionApplication.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Application with ID '${id}' not found or you do not have access to it`);
        }

        return tx.admissionApplication.update({
          where: { id },
          data,
        });
      },
    );
  }

  async softDelete(id: string, actor: RequestContextUser): Promise<AdmissionApplication> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionApplication.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Application with ID '${id}' not found or you do not have access to it`);
        }

        return tx.admissionApplication.update({
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
