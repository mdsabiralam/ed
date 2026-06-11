import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { AdmissionApplicationsRepository } from './repositories/admission-applications.repository';
import { CreateAdmissionApplicationDto } from './dto/create-admission-application.dto';
import { UpdateAdmissionApplicationDto } from './dto/update-admission-application.dto';
import { FilterAdmissionApplicationDto } from './dto/filter-admission-application.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionApplication, ApplicationStatus, AdmissionSessionStatus, Prisma, User, Guardian } from '@prisma/client';
import { ApplicationLockedException } from '../../common/exceptions/admission.exceptions';
import { ApplicationNumberService } from './services/application-number.service';
import { AdmissionTimelineService } from './services/admission-timeline.service';
import { AdmissionFormTemplatesRepository } from '../admission-form-templates/repositories/admission-form-templates.repository';
import { LeadsRepository } from '../leads/repositories/leads.repository';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

export class GuardianInvitationCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly token: string,
    public readonly name: string,
  ) {}
}

@Injectable()
export class AdmissionApplicationsService {
  constructor(
    private readonly repository: AdmissionApplicationsRepository,
    private readonly numberService: ApplicationNumberService,
    private readonly timelineService: AdmissionTimelineService,
    private readonly templateRepository: AdmissionFormTemplatesRepository,
    private readonly leadsRepository: LeadsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private validateApplicationEditable(status: ApplicationStatus): void {
    const lockedStates: ApplicationStatus[] = ['APPROVED', 'REJECTED', 'MATRICULATED'];
    if (lockedStates.includes(status)) {
      throw new ApplicationLockedException();
    }
  }

  private validateCustomFields(templateFields: any[], customFields: any) {
    if (!templateFields || templateFields.length === 0) return;
    const data = customFields || {};

    for (const field of templateFields) {
      const value = data[field.name];
      // 1. Validate required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new BadRequestException(`Required custom field '${field.name}' (${field.label}) is missing`);
      }

      // 2. Validate data types
      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'number') {
          if (isNaN(Number(value))) {
            throw new BadRequestException(`Custom field '${field.name}' must be a number`);
          }
        } else if (field.type === 'boolean') {
          if (value !== true && value !== false && value !== 'true' && value !== 'false') {
            throw new BadRequestException(`Custom field '${field.name}' must be a boolean`);
          }
        } else if (field.type === 'date') {
          if (isNaN(Date.parse(value))) {
            throw new BadRequestException(`Custom field '${field.name}' must be a valid date string`);
          }
        }
      }
    }
  }

  async submitApplication(createDto: CreateAdmissionApplicationDto, actor: RequestContextUser): Promise<AdmissionApplication> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // 1. Verify Admission Session is open
        const session = await tx.admissionSession.findFirst({
          where: { id: createDto.admissionSessionId, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!session) {
          throw new NotFoundException(`Admission Session with ID '${createDto.admissionSessionId}' not found`);
        }
        if (session.status !== AdmissionSessionStatus.OPEN) {
          throw new BadRequestException(`Admission Session '${session.name}' is currently not open (Status: ${session.status})`);
        }

        // 2. Validate Custom Fields against active Form Template for className
        const template = await tx.admissionFormTemplate.findFirst({
          where: { instituteId: actor.instituteId, className: createDto.className, isActive: true, deletedAt: null },
        });
        if (template && template.formFieldsJson) {
          const fields = template.formFieldsJson as any[];
          this.validateCustomFields(fields, createDto.customFieldsJson);
        }

        // 3. Generate Sequential Application Number
        const appNumber = await this.numberService.generate(tx, actor.instituteId);

        // 4. Create Application record
        const app = await tx.admissionApplication.create({
          data: {
            instituteId: actor.instituteId,
            branchId: actor.branchId || '00000000-0000-0000-0000-000000000000', // Default HQ if null
            leadId: createDto.leadId || null,
            admissionSessionId: createDto.admissionSessionId,
            applicationNumber: appNumber,
            firstName: createDto.firstName,
            lastName: createDto.lastName,
            email: createDto.email || null,
            phone: createDto.phone || null,
            dateOfBirth: new Date(createDto.dateOfBirth),
            gender: createDto.gender || null,
            className: createDto.className,
            sectionName: createDto.sectionName || null,
            guardianFirstName: createDto.guardianFirstName,
            guardianLastName: createDto.guardianLastName,
            guardianEmail: createDto.guardianEmail,
            guardianPhone: createDto.guardianPhone,
            guardianRelation: createDto.guardianRelation,
            guardianOccupation: createDto.guardianOccupation || null,
            status: 'SUBMITTED',
            customFieldsJson: createDto.customFieldsJson ? JSON.parse(JSON.stringify(createDto.customFieldsJson)) : Prisma.JsonNull,
          },
        });

        // 5. Track milestones in timeline log
        await this.timelineService.logEvent(
          tx,
          {
            action: 'APPLICATION_CREATED',
            recordId: app.id,
            message: `Admission application created for candidate ${app.firstName} ${app.lastName}`,
            newValue: app,
          },
          actor,
        );

        await this.timelineService.logEvent(
          tx,
          {
            action: 'APPLICATION_SUBMITTED',
            recordId: app.id,
            message: `Admission application ${app.applicationNumber} submitted successfully`,
            newValue: app,
          },
          actor,
        );

        return app;
      },
    );
  }

  async convertLeadToApplication(
    leadId: string,
    payload: any, // ConvertLeadDto details
    actor: RequestContextUser,
  ): Promise<AdmissionApplication> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // 1. Fetch Lead
        const lead = await tx.lead.findFirst({
          where: { id: leadId, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!lead) {
          throw new NotFoundException(`Lead with ID '${leadId}' not found`);
        }

        // 2. Validate Admission Session is open
        const session = await tx.admissionSession.findFirst({
          where: { id: lead.admissionSessionId, instituteId: actor.instituteId, deletedAt: null },
        });
        if (!session || session.status !== AdmissionSessionStatus.OPEN) {
          throw new BadRequestException('Session is not open');
        }

        // 3. Generate sequential app number
        const appNumber = await this.numberService.generate(tx, actor.instituteId);

        // 4. Create Application record
        const app = await tx.admissionApplication.create({
          data: {
            instituteId: actor.instituteId,
            branchId: lead.branchId || actor.branchId || '00000000-0000-0000-0000-000000000000',
            leadId: lead.id,
            admissionSessionId: lead.admissionSessionId,
            applicationNumber: appNumber,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            dateOfBirth: new Date(payload.dateOfBirth),
            gender: payload.gender || null,
            className: lead.className || 'Class 1',
            guardianFirstName: payload.guardianFirstName,
            guardianLastName: payload.guardianLastName,
            guardianEmail: payload.guardianEmail,
            guardianPhone: payload.guardianPhone,
            guardianRelation: payload.guardianRelation,
            guardianOccupation: payload.guardianOccupation || null,
            status: 'SUBMITTED',
          },
        });

        // 5. Update lead status
        await tx.lead.update({
          where: { id: leadId },
          data: { status: 'APPLICATION_SUBMITTED' },
        });

        // 6. Log timeline event
        await this.timelineService.logEvent(
          tx,
          {
            action: 'LEAD_CONVERTED',
            recordId: app.id,
            message: `Lead converted to admission application ${app.applicationNumber} for candidate ${app.firstName} ${app.lastName}`,
            newValue: app,
          },
          actor,
        );

        return app;
      },
    );
  }

  async inviteGuardian(application: AdmissionApplication, tx: Prisma.TransactionClient): Promise<string> {
    // Deduplication check: check if user already exists in this institute
    let user = await tx.user.findFirst({
      where: {
        instituteId: application.instituteId,
        email: application.guardianEmail,
      },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // 1. Create disabled Guardian User account (no password)
      user = await tx.user.create({
        data: {
          instituteId: application.instituteId,
          branchId: application.branchId,
          email: application.guardianEmail,
          passwordHash: 'INVITATION_PENDING',
          firstName: application.guardianFirstName,
          lastName: application.guardianLastName,
          phone: application.guardianPhone,
          isActive: false, // Account disabled until password setup
        },
      });

      // 2. Create Guardian profile
      await tx.guardian.create({
        data: {
          id: user.id,
          instituteId: application.instituteId,
          relationToStudent: application.guardianRelation,
          occupation: application.guardianOccupation,
        },
      });

      // Assign guardian role
      const role = await tx.role.findFirst({
        where: {
          name: 'GUARDIAN',
          OR: [{ instituteId: null }, { instituteId: application.instituteId }],
          deletedAt: null,
        },
      });
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            instituteId: application.instituteId,
            branchId: application.branchId,
          },
        });
      }
    } else {
      // Check if guardian profile exists for this user
      const guardianProfile = await tx.guardian.findUnique({
        where: { id: user.id },
      });
      if (!guardianProfile) {
        await tx.guardian.create({
          data: {
            id: user.id,
            instituteId: application.instituteId,
            relationToStudent: application.guardianRelation,
            occupation: application.guardianOccupation,
          },
        });
      }
    }

    // Link application to the resolved guardian ID
    await tx.admissionApplication.update({
      where: { id: application.id },
      data: { guardianId: user.id },
    });

    // 3. Generate Password Setup Token for invitation onboarding (only if it's a new user)
    let setupToken = '';
    if (isNewUser) {
      setupToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration bounds

      await tx.passwordResetToken.create({
        data: {
          instituteId: application.instituteId,
          userId: user.id,
          tokenHash: setupToken, // Storing directly for public verify/lookup
          expiresAt,
        },
      });

      // 4. Publish Event
      const inviteEvent = new GuardianInvitationCreatedEvent(
        user.id,
        user.email,
        setupToken,
        `${user.firstName} ${user.lastName}`,
      );
      console.log('EVENT PUBLISHED: GuardianInvitationCreatedEvent', inviteEvent);
    }

    return user.id;
  }

  async activateGuardianAccount(token: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Verify token exists, not used, and not expired
      const resetToken = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash: token,
          isUsed: false,
          expiresAt: { gte: new Date() },
        },
      });
      if (!resetToken) {
        throw new BadRequestException('Invitation link is invalid or has expired');
      }

      // 2. Set password and enable user account
      const hashedPass = await argon2.hash(passwordHash);
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: hashedPass,
          isActive: true,
        },
      });

      // 3. Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { isUsed: true },
      });
    });
  }

  async findAll(
    filters: FilterAdmissionApplicationDto,
    actor: RequestContextUser,
  ): Promise<{ data: AdmissionApplication[]; total: number }> {
    return this.repository.findAll(filters, actor);
  }

  async findOne(id: string, actor: RequestContextUser): Promise<AdmissionApplication> {
    const app = await this.repository.findById(id, actor);
    if (!app) {
      throw new NotFoundException(`Admission Application with ID '${id}' not found or you do not have access to it`);
    }
    return app;
  }

  async update(
    id: string,
    updateDto: UpdateAdmissionApplicationDto,
    actor: RequestContextUser,
  ): Promise<AdmissionApplication> {
    const existing = await this.findOne(id, actor);
    this.validateApplicationEditable(existing.status);

    const data: any = {};
    if (updateDto.firstName) data.firstName = updateDto.firstName;
    if (updateDto.lastName) data.lastName = updateDto.lastName;
    if (updateDto.email !== undefined) data.email = updateDto.email;
    if (updateDto.phone !== undefined) data.phone = updateDto.phone;
    if (updateDto.dateOfBirth) data.dateOfBirth = new Date(updateDto.dateOfBirth);
    if (updateDto.gender !== undefined) data.gender = updateDto.gender;
    if (updateDto.className) data.className = updateDto.className;
    if (updateDto.sectionName !== undefined) data.sectionName = updateDto.sectionName;
    if (updateDto.guardianFirstName) data.guardianFirstName = updateDto.guardianFirstName;
    if (updateDto.guardianLastName) data.guardianLastName = updateDto.guardianLastName;
    if (updateDto.guardianEmail) data.guardianEmail = updateDto.guardianEmail;
    if (updateDto.guardianPhone) data.guardianPhone = updateDto.guardianPhone;
    if (updateDto.guardianRelation) data.guardianRelation = updateDto.guardianRelation;
    if (updateDto.guardianOccupation !== undefined) data.guardianOccupation = updateDto.guardianOccupation;
    if (updateDto.customFieldsJson) {
      data.customFieldsJson = JSON.parse(JSON.stringify(updateDto.customFieldsJson));
    }

    // Handles status change and invitation flow
    if (updateDto.status && updateDto.status !== existing.status) {
      data.status = updateDto.status;
      
      return this.prisma.runWithTenantContext(
        { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
        async (tx) => {
          // If status transitions to APPROVED, trigger the guardian invitation onboarding process!
          if (updateDto.status === 'APPROVED' && existing.status !== 'APPROVED') {
            await this.inviteGuardian(existing, tx);
          }

          const updated = await tx.admissionApplication.update({
            where: { id },
            data,
          });

          await this.timelineService.logEvent(
            tx,
            {
              action: 'STATUS_CHANGED',
              recordId: id,
              message: `Application status transitioned from ${existing.status} to ${updated.status}`,
              oldValue: { status: existing.status },
              newValue: { status: updated.status },
            },
            actor,
          );

          return updated;
        },
      );
    }

    return this.repository.update(id, data, actor);
  }

  async remove(id: string, actor: RequestContextUser): Promise<AdmissionApplication> {
    const existing = await this.findOne(id, actor);
    this.validateApplicationEditable(existing.status);

    return this.repository.softDelete(id, actor);
  }
}
