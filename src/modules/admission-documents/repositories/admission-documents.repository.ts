import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdmissionDocument, Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class AdmissionDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getBranchScope(actor: RequestContextUser): Prisma.AdmissionDocumentWhereInput {
    if (actor.roles.includes('SUPER_ADMIN')) {
      return {};
    }

    const branchRestrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
    const isRestricted = actor.roles.some((r) => branchRestrictedRoles.includes(r));

    if (isRestricted) {
      return {
        application: {
          branchId: actor.branchId || '00000000-0000-0000-0000-000000000000',
        },
      };
    }

    return {};
  }

  async create(
    data: Omit<Prisma.AdmissionDocumentUncheckedCreateInput, 'instituteId'>,
    actor: RequestContextUser,
  ): Promise<AdmissionDocument> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // Enforce application exists and is editable under branch rules
        const branchRestrictedRoles = ['ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT'];
        const isRestricted = actor.roles.some((r) => branchRestrictedRoles.includes(r));

        const app = await tx.admissionApplication.findFirst({
          where: {
            id: data.applicationId,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...(isRestricted ? { branchId: actor.branchId || '00000000-0000-0000-0000-000000000000' } : {}),
          },
        });

        if (!app) {
          throw new NotFoundException(`Admission Application with ID '${data.applicationId}' not found or inaccessible`);
        }

        // State lock check: cannot add documents if application is processed
        const lockedStates = ['APPROVED', 'REJECTED', 'MATRICULATED'];
        if (lockedStates.includes(app.status)) {
          throw new BadRequestException('Cannot upload documents for processed applications');
        }

        return tx.admissionDocument.create({
          data: {
            ...data,
            instituteId: actor.instituteId,
          },
        });
      },
    );
  }

  async findById(id: string, actor: RequestContextUser): Promise<AdmissionDocument | null> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionDocument.findFirst({
          where: {
            id,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...branchScope,
          },
          include: {
            application: true,
          },
        });
      },
    );
  }

  async findAllByApplication(applicationId: string, actor: RequestContextUser): Promise<AdmissionDocument[]> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.admissionDocument.findMany({
          where: {
            applicationId,
            instituteId: actor.instituteId,
            deletedAt: null,
            ...branchScope,
          },
        });
      },
    );
  }

  async update(
    id: string,
    data: Prisma.AdmissionDocumentUncheckedUpdateInput,
    actor: RequestContextUser,
  ): Promise<AdmissionDocument> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const doc = await tx.admissionDocument.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
          include: { application: true },
        });

        if (!doc) {
          throw new NotFoundException(`Admission Document with ID '${id}' not found`);
        }

        // State lock check: block modifications if application status is locked
        const lockedStates = ['APPROVED', 'REJECTED', 'MATRICULATED'];
        if (lockedStates.includes(doc.application.status)) {
          throw new BadRequestException('Cannot modify documents for processed applications');
        }

        return tx.admissionDocument.update({
          where: { id },
          data,
        });
      },
    );
  }

  async softDelete(id: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    const branchScope = this.getBranchScope(actor);
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const doc = await tx.admissionDocument.findFirst({
          where: { id, instituteId: actor.instituteId, deletedAt: null, ...branchScope },
          include: { application: true },
        });

        if (!doc) {
          throw new NotFoundException(`Admission Document with ID '${id}' not found`);
        }

        // State lock check: block deletion if application is processed
        const lockedStates = ['APPROVED', 'REJECTED', 'MATRICULATED'];
        if (lockedStates.includes(doc.application.status)) {
          throw new BadRequestException('Cannot delete documents for processed applications');
        }

        return tx.admissionDocument.update({
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
