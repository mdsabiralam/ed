import { Injectable, NotFoundException } from '@nestjs/common';
import { AdmissionDocumentsRepository } from './repositories/admission-documents.repository';
import { CreateAdmissionDocumentDto } from './dto/create-admission-document.dto';
import { UpdateAdmissionDocumentDto } from './dto/update-admission-document.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionDocument } from '@prisma/client';
import { AdmissionTimelineService } from '../admission-applications/services/admission-timeline.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdmissionDocumentsService {
  constructor(
    private readonly repository: AdmissionDocumentsRepository,
    private readonly timelineService: AdmissionTimelineService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createDto: CreateAdmissionDocumentDto, actor: RequestContextUser): Promise<AdmissionDocument> {
    const doc = await this.repository.create(
      {
        applicationId: createDto.applicationId,
        documentType: createDto.documentType,
        fileUrl: createDto.fileUrl,
        verificationStatus: 'PENDING',
      },
      actor,
    );

    await this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        await this.timelineService.logEvent(
          tx,
          {
            action: 'DOCUMENT_UPLOADED',
            recordId: doc.applicationId,
            message: `Document of type ${doc.documentType} uploaded for application`,
            newValue: doc,
          },
          actor,
        );
      },
    );

    return doc;
  }

  async verifyDocument(id: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const doc = await this.repository.update(
          id,
          {
            verificationStatus: 'VERIFIED',
            verifiedBy: actor.userId,
            verifiedAt: new Date(),
            rejectedReason: null,
          },
          actor,
        );

        await this.timelineService.logEvent(
          tx,
          {
            action: 'DOCUMENT_VERIFIED',
            recordId: doc.applicationId,
            message: `Document ID ${doc.id} (${doc.documentType}) has been verified`,
            newValue: doc,
          },
          actor,
        );

        return doc;
      },
    );
  }

  async rejectDocument(id: string, reason: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    return this.repository.update(
      id,
      {
        verificationStatus: 'REJECTED',
        rejectedReason: reason,
        verifiedBy: null,
        verifiedAt: null,
      },
      actor,
    );
  }

  async requestReupload(id: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    return this.repository.update(
      id,
      {
        verificationStatus: 'PENDING',
        fileUrl: '', // Reset fileUrl to allow re-submission
        rejectedReason: 'Re-upload requested by admissions reviewer',
        verifiedBy: null,
        verifiedAt: null,
      },
      actor,
    );
  }

  async findAllByApplication(applicationId: string, actor: RequestContextUser): Promise<AdmissionDocument[]> {
    return this.repository.findAllByApplication(applicationId, actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    const doc = await this.repository.findById(id, actor);
    if (!doc) {
      throw new NotFoundException(`Admission Document with ID '${id}' not found`);
    }
    return doc;
  }

  async update(
    id: string,
    updateDto: UpdateAdmissionDocumentDto,
    actor: RequestContextUser,
  ): Promise<AdmissionDocument> {
    const data: any = {};
    if (updateDto.applicationId) data.applicationId = updateDto.applicationId;
    if (updateDto.documentType) data.documentType = updateDto.documentType;
    if (updateDto.fileUrl) data.fileUrl = updateDto.fileUrl;
    if (updateDto.verificationStatus) data.verificationStatus = updateDto.verificationStatus;
    if (updateDto.rejectedReason !== undefined) data.rejectedReason = updateDto.rejectedReason;

    return this.repository.update(id, data, actor);
  }

  async remove(id: string, actor: RequestContextUser): Promise<AdmissionDocument> {
    return this.repository.softDelete(id, actor);
  }
}
