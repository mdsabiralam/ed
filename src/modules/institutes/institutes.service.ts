import { Injectable, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import * as argon2 from 'argon2';

@Injectable()
export class InstitutesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Provision a new tenant (Institute) with default branch, sequence counters,
   * feature flags based on the plan, and the initial owner user.
   */
  async create(createDto: CreateInstituteDto, actor: RequestContextUser): Promise<any> {
    // Check authorizations (Only SUPER_ADMIN can create institutes)
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only system super administrators can provision new institutes');
    }

    // Check subdomain availability
    const subdomainExists = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true },
      async (tx) => {
        return tx.institute.findFirst({ where: { subdomain: createDto.subdomain } });
      },
    );

    if (subdomainExists) {
      throw new ConflictException('Subdomain is already registered by another institute');
    }

    // Check user email availability
    const emailExists = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true },
      async (tx) => {
        return tx.user.findFirst({ where: { email: createDto.adminEmail } });
      },
    );

    if (emailExists) {
      throw new ConflictException('Administrator email is already registered in the system');
    }

    // Run provisioning in a transaction bypassing RLS initially
    const result = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true },
      async (tx) => {
        // 1. Create Institute
        const institute = await tx.institute.create({
          data: {
            name: createDto.name,
            subdomain: createDto.subdomain,
            logoUrl: createDto.logoUrl,
            planId: createDto.planId,
            subscriptionStatus: 'ACTIVE',
          },
        });

        // 2. Create Default Branch
        const branch = await tx.branch.create({
          data: {
            instituteId: institute.id,
            name: 'Main Campus',
            address: 'Main HQ',
          },
        });

        // 3. Create Admin User
        const hashedPassword = await argon2.hash(createDto.adminPassword);
        const user = await tx.user.create({
          data: {
            instituteId: institute.id,
            branchId: branch.id,
            email: createDto.adminEmail,
            passwordHash: hashedPassword,
            firstName: createDto.adminFirstName,
            lastName: createDto.adminLastName,
          },
        });

        // 4. Fetch the global seeded role 'INSTITUTE_OWNER'
        const ownerRole = await tx.role.findFirst({
          where: { name: 'INSTITUTE_OWNER', instituteId: null },
        });

        if (!ownerRole) {
          throw new NotFoundException("Default 'INSTITUTE_OWNER' role not found in global seeding");
        }

        // 5. Assign Role to User
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: ownerRole.id,
            instituteId: institute.id,
            branchId: branch.id,
          },
        });

        // 6. Onboard default profiles: Admin user counts as staff
        await tx.staffProfile.create({
          data: {
            id: user.id,
            instituteId: institute.id,
            branchId: branch.id,
            designation: 'INSTITUTE_OWNER',
            department: 'Administration',
          },
        });

        // 7. Initialize default sequences for key operational numbers
        const currentYear = new Date().getFullYear();
        const sequences = [
          { type: 'ADMISSION', prefix: `ADM-${currentYear}-` },
          { type: 'EMPLOYEE', prefix: `EMP-${currentYear}-` },
          { type: 'INVOICE', prefix: `INV-${currentYear}-` },
          { type: 'RECEIPT', prefix: `REC-${currentYear}-` },
          { type: 'CERTIFICATE', prefix: `CERT-${currentYear}-` },
          { type: 'IDCARD', prefix: `ID-${currentYear}-` },
        ];

        for (const seq of sequences) {
          await tx.numberSequence.create({
            data: {
              instituteId: institute.id,
              sequenceType: seq.type,
              prefix: seq.prefix,
              currentNumber: 1,
            },
          });
        }

        // 8. Fetch Plan Features and initialize Feature Flags for the tenant
        const features = await tx.planFeature.findMany({
          where: { planId: createDto.planId },
        });

        for (const feat of features) {
          await tx.featureFlag.create({
            data: {
              instituteId: institute.id,
              flagKey: feat.featureKey,
              isEnabled: feat.isEnabled,
            },
          });
        }

        // 9. Create SaaS Subscription details
        await tx.instituteSubscription.create({
          data: {
            instituteId: institute.id,
            planId: createDto.planId,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial/cycle
            billingCycle: 'MONTHLY',
            amount: 0.0, // Trial setup
          },
        });

        // 10. Audit trail log
        await tx.auditLog.create({
          data: {
            instituteId: institute.id,
            userId: actor.userId,
            action: 'institute.create',
            tableName: 'institutes',
            recordId: institute.id,
            newValue: { name: institute.name, subdomain: institute.subdomain },
          },
        });

        return {
          institute,
          branch,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        };
      },
    );

    return result;
  }

  /**
   * Fetch all institutes. Only SUPER_ADMIN can fetch all.
   * Other users get their own institute based on RLS.
   */
  async findAll(actor: RequestContextUser): Promise<any[]> {
    if (actor.roles.includes('SUPER_ADMIN')) {
      return this.prisma.runWithTenantContext(
        { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true },
        async (tx) => {
          return tx.institute.findMany({ where: { deletedAt: null } });
        },
      );
    }

    // Enforce tenant boundaries using runWithTenantContext
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0] },
      async (tx) => {
        return tx.institute.findMany({ where: { deletedAt: null } });
      },
    );
  }

  /**
   * Find a specific institute
   */
  async findOne(id: string, actor: RequestContextUser): Promise<any> {
    if (!actor.roles.includes('SUPER_ADMIN') && actor.instituteId !== id) {
      throw new ForbiddenException('You are not authorized to access data of another institute');
    }

    const context = actor.roles.includes('SUPER_ADMIN')
      ? { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true }
      : { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0] };

    const institute = await this.prisma.runWithTenantContext(context, async (tx) => {
      return tx.institute.findUnique({ where: { id, deletedAt: null } });
    });

    if (!institute) {
      throw new NotFoundException('Institute record not found');
    }

    return institute;
  }

  /**
   * Update institute settings
   */
  async update(id: string, updateDto: UpdateInstituteDto, actor: RequestContextUser): Promise<any> {
    if (!actor.roles.includes('SUPER_ADMIN') && actor.instituteId !== id) {
      throw new ForbiddenException('You are not authorized to update another institute');
    }

    const context = actor.roles.includes('SUPER_ADMIN')
      ? { instituteId: null, userId: actor.userId, userRole: 'SUPER_ADMIN', bypassRls: true }
      : { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0] };

    const updated = await this.prisma.runWithTenantContext(context, async (tx) => {
      const existing = await tx.institute.findUnique({ where: { id, deletedAt: null } });
      if (!existing) {
        throw new NotFoundException('Institute record not found');
      }

      const updatedRecord = await tx.institute.update({
        where: { id },
        data: {
          name: updateDto.name,
          subdomain: updateDto.subdomain,
          logoUrl: updateDto.logoUrl,
          planId: updateDto.planId,
          subscriptionStatus: updateDto.subscriptionStatus,
        },
      });

      // Write audit
      await tx.auditLog.create({
        data: {
          instituteId: id,
          userId: actor.userId,
          action: 'institute.update',
          tableName: 'institutes',
          recordId: id,
          oldValue: existing,
          newValue: updatedRecord,
        },
      });

      return updatedRecord;
    });

    return updated;
  }
}
