import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';

export interface TimelineEventInput {
  action: 'APPLICATION_CREATED' | 'APPLICATION_SUBMITTED' | 'LEAD_CONVERTED' | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'INTERVIEW_SCHEDULED' | 'STATUS_CHANGED';
  recordId: string;
  message: string;
  oldValue?: any;
  newValue?: any;
}

@Injectable()
export class AdmissionTimelineService {
  async logEvent(
    tx: Prisma.TransactionClient,
    input: TimelineEventInput,
    actor: RequestContextUser,
  ): Promise<void> {
    const { action, recordId, message, oldValue = null, newValue = null } = input;

    // 1. Create AuditLog entry
    await tx.auditLog.create({
      data: {
        instituteId: actor.instituteId,
        branchId: actor.branchId,
        userId: actor.userId,
        action,
        tableName: 'admission_applications',
        recordId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : Prisma.JsonNull,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : Prisma.JsonNull,
        ipAddress: '127.0.0.1',
      },
    });

    // 2. Create Activity entry
    await tx.activity.create({
      data: {
        instituteId: actor.instituteId,
        branchId: actor.branchId,
        userId: actor.userId,
        message,
        activityType: 'ADMISSION_LIFECYCLE',
      },
    });
  }
}
