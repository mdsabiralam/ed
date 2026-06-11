import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdmissionFormTemplate, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class AdmissionFormTemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Prisma.AdmissionFormTemplateUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<AdmissionFormTemplate> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // If template is set to active, deactivate others for same class
        if (data.isActive) {
          await tx.admissionFormTemplate.updateMany({
            where: {
              instituteId: actor.instituteId,
              className: data.className,
              isActive: true,
              deletedAt: null,
            },
            data: { isActive: false },
          });
        }

        return tx.admissionFormTemplate.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate | null> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionFormTemplate.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            deletedAt: null,
          },
        });
      },
    );
  }

  async findActiveByClass(className: string, instituteId: string): Promise<AdmissionFormTemplate | null> {
    // Queries active template without session context (bypassed inside submit validation check)
    return this.prisma.admissionFormTemplate.findFirst({
      where: {
        instituteId,
        className,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  async findAll(actor: RequestContextUser): Promise<AdmissionFormTemplate[]> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionFormTemplate.findMany({
          where: {
            instituteId: actor.instituteId,
            deletedAt: null,
          },
          orderBy: { className: 'asc' },
        });
      },
    );
  }

  async update(
    id: string,
    data: Prisma.AdmissionFormTemplateUncheckedUpdateInput,
    actor: RequestContextUser,
  ): Promise<AdmissionFormTemplate> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionFormTemplate.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Form Template with ID '${id}' not found`);
        }

        // If template status is changing to active, deactivate others for same class
        if (data.isActive === true) {
          await tx.admissionFormTemplate.updateMany({
            where: {
              instituteId: actor.instituteId,
              className: (data.className as string) || exists.className,
              isActive: true,
              deletedAt: null,
              NOT: { id },
            },
            data: { isActive: false },
          });
        }

        return tx.admissionFormTemplate.update({
          where: { id },
          data,
        });
      },
    );
  }

  async setActiveState(id: string, isActive: boolean, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionFormTemplate.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Form Template with ID '${id}' not found`);
        }

        if (isActive) {
          // Deactivate all others
          await tx.admissionFormTemplate.updateMany({
            where: {
              instituteId: actor.instituteId,
              className: exists.className,
              isActive: true,
              deletedAt: null,
              NOT: { id },
            },
            data: { isActive: false },
          });
        }

        return tx.admissionFormTemplate.update({
          where: { id },
          data: { isActive },
        });
      },
    );
  }

  async softDelete(id: string, actor: RequestContextUser): Promise<AdmissionFormTemplate> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const exists = await tx.admissionFormTemplate.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!exists) {
          throw new NotFoundException(`Admission Form Template with ID '${id}' not found`);
        }

        return tx.admissionFormTemplate.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: actor.userId,
            isActive: false, // Turn off active status
          },
        });
      },
    );
  }
}
