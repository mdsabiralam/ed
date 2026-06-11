import { Injectable, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestContextUser } from '../../common/decorators/current-user.decorator';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new user with base credentials and custom profile mappings
   */
  async create(createDto: CreateUserDto, actor: RequestContextUser): Promise<any> {
    const instituteId = actor.instituteId;

    // Check email uniqueness globally
    const emailExists = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: actor.userId, userRole: actor.roles[0], bypassRls: true },
      async (tx) => {
        return tx.user.findFirst({ where: { email: createDto.email } });
      },
    );
    if (emailExists) {
      throw new ConflictException('Email address is already in use by another account');
    }

    // Run inside tenant RLS context
    const result = await this.prisma.runWithTenantContext(
      { instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        // 1. Create Base User
        const hashedPassword = await argon2.hash(createDto.password);
        const user = await tx.user.create({
          data: {
            instituteId,
            branchId: createDto.branchId || actor.branchId,
            email: createDto.email,
            passwordHash: hashedPassword,
            firstName: createDto.firstName,
            lastName: createDto.lastName,
            phone: createDto.phone,
          },
        });

        // 2. Assign Roles
        for (const roleName of createDto.roleNames) {
          // Resolve role (matches global roles where instituteId IS NULL, or tenant custom roles)
          const role = await tx.role.findFirst({
            where: {
              name: roleName,
              OR: [{ instituteId: null }, { instituteId }],
              deletedAt: null,
            },
          });

          if (!role) {
            throw new NotFoundException(`Role '${roleName}' not found in tenant or system registry`);
          }

          await tx.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
              instituteId,
              branchId: createDto.branchId || actor.branchId,
            },
          });
        }

        // 3. Provision Profile details if profileType is selected
        let profile: any = null;
        const pData = createDto.profileData || {};

        if (createDto.profileType === 'STUDENT') {
          profile = await tx.student.create({
            data: {
              id: user.id,
              instituteId,
              branchId: createDto.branchId || actor.branchId || '',
              rollNumber: pData.rollNumber,
              admissionNumber: pData.admissionNumber || `ADM-${Date.now()}`,
              guardianId: pData.guardianId,
            },
          });
        } else if (createDto.profileType === 'GUARDIAN') {
          profile = await tx.guardian.create({
            data: {
              id: user.id,
              instituteId,
              relationToStudent: pData.relationToStudent,
              occupation: pData.occupation,
              emergencyPhone: pData.emergencyPhone,
            },
          });
        } else if (createDto.profileType === 'DRIVER') {
          profile = await tx.driver.create({
            data: {
              id: user.id,
              instituteId,
              licenseNumber: pData.licenseNumber || 'PENDING',
              licenseExpiry: pData.licenseExpiry ? new Date(pData.licenseExpiry) : null,
              vehicleNumber: pData.vehicleNumber,
            },
          });
        } else if (createDto.profileType === 'STAFF' || createDto.profileType === 'TEACHER') {
          profile = await tx.staffProfile.create({
            data: {
              id: user.id,
              instituteId,
              branchId: createDto.branchId || actor.branchId,
              designation: pData.designation || createDto.profileType,
              department: pData.department,
              joiningDate: pData.joiningDate ? new Date(pData.joiningDate) : null,
              qualification: pData.qualification,
              salary: pData.salary,
            },
          });
        }

        // 4. Log audit log
        await tx.auditLog.create({
          data: {
            instituteId,
            userId: actor.userId,
            action: 'user.create',
            tableName: 'users',
            recordId: user.id,
            newValue: {
              email: user.email,
              roles: createDto.roleNames,
              profileType: createDto.profileType,
            },
          },
        });

        // 5. Timeline logger
        const actorName = `${actor.email}`;
        await tx.activity.create({
          data: {
            instituteId,
            userId: actor.userId,
            message: `${actorName} onboarded new user ${user.firstName} ${user.lastName} (${createDto.profileType || 'USER'})`,
            activityType: 'USER_CREATION',
          },
        });

        return { user, profile };
      },
    );

    return result;
  }

  /**
   * Find all users of the current institute (enforced by RLS context)
   */
  async findAll(actor: RequestContextUser): Promise<any[]> {
    return this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.user.findMany({
          where: { deletedAt: null },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            studentProfile: true,
            guardianProfile: true,
            driverProfile: true,
            staffProfile: true,
          },
        });
      },
    );
  }

  /**
   * Find single user profile
   */
  async findOne(id: string, actor: RequestContextUser): Promise<any> {
    const result = await this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        return tx.user.findUnique({
          where: { id, deletedAt: null },
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
            studentProfile: true,
            guardianProfile: true,
            driverProfile: true,
            staffProfile: true,
          },
        });
      },
    );

    if (!result) {
      throw new NotFoundException('User profile not found');
    }

    return result;
  }

  /**
   * Update user details and respective profile extensions
   */
  async update(id: string, updateDto: UpdateUserDto, actor: RequestContextUser): Promise<any> {
    const result = await this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id, deletedAt: null },
          include: {
            studentProfile: true,
            guardianProfile: true,
            driverProfile: true,
            staffProfile: true,
          },
        });

        if (!user) {
          throw new NotFoundException('User profile not found');
        }

        // 1. Update Base User fields
        const updatedUser = await tx.user.update({
          where: { id },
          data: {
            firstName: updateDto.firstName,
            lastName: updateDto.lastName,
            phone: updateDto.phone,
            isActive: updateDto.isActive,
            branchId: updateDto.branchId,
          },
        });

        // 2. Update Roles if provided
        if (updateDto.roleNames) {
          // Clear current roles
          await tx.userRole.deleteMany({ where: { userId: id } });

          // Map new roles
          for (const roleName of updateDto.roleNames) {
            const role = await tx.role.findFirst({
              where: {
                name: roleName,
                OR: [{ instituteId: null }, { instituteId: actor.instituteId }],
                deletedAt: null,
              },
            });

            if (role) {
              await tx.userRole.create({
                data: {
                  userId: id,
                  roleId: role.id,
                  instituteId: actor.instituteId,
                  branchId: updateDto.branchId || user.branchId,
                },
              });
            }
          }
        }

        // 3. Update Profiles details
        let updatedProfile: any = null;
        const pData = updateDto.profileData || {};

        if (user.studentProfile) {
          updatedProfile = await tx.student.update({
            where: { id },
            data: {
              rollNumber: pData.rollNumber,
              admissionNumber: pData.admissionNumber,
              guardianId: pData.guardianId,
              branchId: updateDto.branchId || undefined,
            },
          });
        } else if (user.guardianProfile) {
          updatedProfile = await tx.guardian.update({
            where: { id },
            data: {
              relationToStudent: pData.relationToStudent,
              occupation: pData.occupation,
              emergencyPhone: pData.emergencyPhone,
            },
          });
        } else if (user.driverProfile) {
          updatedProfile = await tx.driver.update({
            where: { id },
            data: {
              licenseNumber: pData.licenseNumber,
              licenseExpiry: pData.licenseExpiry ? new Date(pData.licenseExpiry) : undefined,
              vehicleNumber: pData.vehicleNumber,
            },
          });
        } else if (user.staffProfile) {
          updatedProfile = await tx.staffProfile.update({
            where: { id },
            data: {
              designation: pData.designation,
              department: pData.department,
              joiningDate: pData.joiningDate ? new Date(pData.joiningDate) : undefined,
              qualification: pData.qualification,
              salary: pData.salary,
              branchId: updateDto.branchId || undefined,
            },
          });
        }

        // Log audit
        await tx.auditLog.create({
          data: {
            instituteId: actor.instituteId,
            userId: actor.userId,
            action: 'user.update',
            tableName: 'users',
            recordId: id,
            oldValue: user,
            newValue: { user: updatedUser, profile: updatedProfile },
          },
        });

        return { user: updatedUser, profile: updatedProfile };
      },
    );

    return result;
  }

  /**
   * Soft-delete user profile
   */
  async remove(id: string, actor: RequestContextUser): Promise<void> {
    await this.prisma.runWithTenantContext(
      { instituteId: actor.instituteId, userId: actor.userId, userRole: actor.roles[0], branchId: actor.branchId },
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id, deletedAt: null },
          include: {
            studentProfile: true,
            guardianProfile: true,
            driverProfile: true,
            staffProfile: true,
          },
        });

        if (!user) {
          throw new NotFoundException('User profile not found');
        }

        // Soft delete user record
        await tx.user.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: actor.userId,
            isActive: false,
          },
        });

        // Soft delete profile records
        if (user.studentProfile) {
          await tx.student.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: actor.userId },
          });
        }
        if (user.guardianProfile) {
          await tx.guardian.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: actor.userId },
          });
        }
        if (user.driverProfile) {
          await tx.driver.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: actor.userId },
          });
        }
        if (user.staffProfile) {
          await tx.staffProfile.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: actor.userId },
          });
        }

        // Revoke all refresh tokens
        await tx.refreshToken.updateMany({
          where: { userId: id, isRevoked: false },
          data: { isRevoked: true },
        });

        await tx.loginSession.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false },
        });

        // Log audit
        await tx.auditLog.create({
          data: {
            instituteId: actor.instituteId,
            userId: actor.userId,
            action: 'user.delete',
            tableName: 'users',
            recordId: id,
          },
        });

        // Activity log
        await tx.activity.create({
          data: {
            instituteId: actor.instituteId,
            userId: actor.userId,
            message: `${actor.email} soft-deleted user ${user.firstName} ${user.lastName}`,
            activityType: 'USER_DELETION',
          },
        });
      },
    );
  }
}
