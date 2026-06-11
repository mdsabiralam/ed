import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdmissionSession, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';
import { FilterAdmissionSessionDto } from '../dto/filter-admission-session.dto';

@Injectable()
export class AdmissionSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Prisma.AdmissionSessionUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<AdmissionSession> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionSession.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<AdmissionSession | null> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionSession.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            deletedAt: null,
          },
        });
      },
    );
  }

  async findAll(
    filters: FilterAdmissionSessionDto,
    actor: RequestContextUser,
  ): Promise<{ data: AdmissionSession[]; total: number }> {
    const { status, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AdmissionSessionWhereInput = {
      instituteId: actor.instituteId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const [data, total] = await Promise.all([
          tx.admissionSession.findMany({
            where,
            skip,
            take: limit,
            orderBy: { startDate: 'desc' },
          }),
          tx.admissionSession.count({ where }),
        ]);
        return { data, total };
      },
    );
  }

  async update(
    id: string,
    data: Prisma.AdmissionSessionUncheckedUpdateInput,
    actor: RequestContextUser,
  ): Promise<AdmissionSession> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // Confirm exist first
        const exists = await tx.admissionSession.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Session with ID '${id}' not found`);
        }

        return tx.admissionSession.update({
          where: { id },
          data,
        });
      },
    );
  }

  async softDelete(id: string, actor: RequestContextUser): Promise<AdmissionSession> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionSession.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Session with ID '${id}' not found`);
        }

        return tx.admissionSession.update({
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
