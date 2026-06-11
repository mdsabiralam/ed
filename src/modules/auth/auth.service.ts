import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials (email & password)
   */
  async validateUser(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    // Run query bypassing RLS since we don't have the institute context yet
    const user = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: null, userRole: null, bypassRls: true },
      async (tx) => {
        return tx.user.findFirst({
          where: { email, deletedAt: null },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      },
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    
    // Flatten permissions unique keys
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    );

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      instituteId: user.instituteId,
      branchId: user.branchId,
      roles,
      permissions,
    };
  }

  /**
   * Log user session and generate tokens
   */
  async login(user: any, meta: { ip: string; userAgent: string; browser?: string; os?: string }): Promise<any> {
    const payload = {
      sub: user.userId,
      email: user.email,
      instituteId: user.instituteId,
      branchId: user.branchId,
      roles: user.roles,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'access_secret_123_change_me_in_prod',
      expiresIn: '15m',
    });

    const refreshPayload = { sub: user.userId, email: user.email };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123_change_me_in_prod',
      expiresIn: '7d',
    });

    // Hash refresh token for DB comparison
    const refreshTokenHash = await argon2.hash(refreshToken);

    // Save refresh token, session, and audit log in transaction
    await this.prisma.runWithTenantContext(
      { instituteId: user.instituteId, userId: user.userId, userRole: user.roles[0], branchId: user.branchId },
      async (tx) => {
        // Save refresh token
        await tx.refreshToken.create({
          data: {
            userId: user.userId,
            token: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        // Save login session
        await tx.loginSession.create({
          data: {
            instituteId: user.instituteId,
            userId: user.userId,
            tokenHash: refreshTokenHash,
            ipAddress: meta.ip,
            deviceInfo: meta.userAgent,
            browser: meta.browser || 'Unknown',
            os: meta.os || 'Unknown',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            instituteId: user.instituteId,
            userId: user.userId,
            action: 'auth.login',
            tableName: 'users',
            recordId: user.userId,
            ipAddress: meta.ip,
            deviceInfo: meta.userAgent,
            browser: meta.browser || 'Unknown',
            newValue: { email: user.email, timestamp: new Date().toISOString() },
          },
        });

        // Log to activity timeline
        await tx.activity.create({
          data: {
            instituteId: user.instituteId,
            branchId: user.branchId,
            userId: user.userId,
            message: `${user.firstName} ${user.lastName} logged in successfully`,
            activityType: 'LOGIN',
          },
        });
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        instituteId: user.instituteId,
        branchId: user.branchId,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  /**
   * Refresh access and refresh tokens
   */
  async refreshTokens(userId: string, oldRefreshToken: string, meta: { ip: string; userAgent: string }): Promise<any> {
    // Check user profile
    const user = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: null, userRole: null, bypassRls: true },
      async (tx) => {
        return tx.user.findUnique({
          where: { id: userId, deletedAt: null },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      },
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or deleted');
    }

    // Verify and rotate refresh tokens inside tenant boundary
    return this.prisma.runWithTenantContext(
      { instituteId: user.instituteId, userId: user.id, userRole: user.userRoles[0]?.role.name || 'GUEST', branchId: user.branchId },
      async (tx) => {
        const dbRefreshTokens = await tx.refreshToken.findMany({
          where: { userId: user.id, isRevoked: false },
        });

        let matchedToken: any = null;
        for (const t of dbRefreshTokens) {
          const isMatch = await argon2.verify(t.token, oldRefreshToken);
          if (isMatch) {
            matchedToken = t;
            break;
          }
        }

        if (!matchedToken || new Date() > matchedToken.expiresAt) {
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Revoke the old token (Refresh Token Rotation!)
        await tx.refreshToken.update({
          where: { id: matchedToken.id },
          data: { isRevoked: true },
        });

        // Revoke old login session
        await tx.loginSession.updateMany({
          where: { userId: user.id, tokenHash: matchedToken.token },
          data: { isActive: false },
        });

        // Generate new token pair
        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = Array.from(
          new Set(
            user.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => rp.permission.name),
            ),
          ),
        );

        const payload = {
          sub: user.id,
          email: user.email,
          instituteId: user.instituteId,
          branchId: user.branchId,
          roles,
          permissions,
        };

        const newAccessToken = this.jwtService.sign(payload, {
          secret: process.env.JWT_ACCESS_SECRET || 'access_secret_123_change_me_in_prod',
          expiresIn: '15m',
        });

        const newRefreshPayload = { sub: user.id, email: user.email };
        const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123_change_me_in_prod',
          expiresIn: '7d',
        });

        const newHash = await argon2.hash(newRefreshToken);

        // Save new refresh token and session
        await tx.refreshToken.create({
          data: {
            userId: user.id,
            token: newHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.loginSession.create({
          data: {
            instituteId: user.instituteId,
            userId: user.id,
            tokenHash: newHash,
            ipAddress: meta.ip,
            deviceInfo: meta.userAgent,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        };
      },
    );
  }

  /**
   * Log out and invalidate sessions
   */
  async logout(userId: string, refreshToken: string, instituteId: string): Promise<void> {
    await this.prisma.runWithTenantContext(
      { instituteId, userId, userRole: null },
      async (tx) => {
        const dbRefreshTokens = await tx.refreshToken.findMany({
          where: { userId, isRevoked: false },
        });

        for (const tokenRecord of dbRefreshTokens) {
          const isMatch = await argon2.verify(tokenRecord.token, refreshToken);
          if (isMatch) {
            // Revoke in DB
            await tx.refreshToken.update({
              where: { id: tokenRecord.id },
              data: { isRevoked: true },
            });

            // Mark login session inactive
            await tx.loginSession.updateMany({
              where: { userId, tokenHash: tokenRecord.token },
              data: { isActive: false },
            });
          }
        }

        // Log audit
        await tx.auditLog.create({
          data: {
            instituteId,
            userId,
            action: 'auth.logout',
            tableName: 'users',
            recordId: userId,
          },
        });
      },
    );
  }

  /**
   * Change password safely
   */
  async changePassword(userId: string, instituteId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.runWithTenantContext(
      { instituteId: null, userId: null, userRole: null, bypassRls: true },
      async (tx) => {
        return tx.user.findUnique({ where: { id: userId, deletedAt: null } });
      },
    );

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const isMatch = await argon2.verify(user.passwordHash, currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newHash = await argon2.hash(newPassword);

    await this.prisma.runWithTenantContext(
      { instituteId, userId, userRole: null },
      async (tx) => {
        // Update password
        await tx.user.update({
          where: { id: userId },
          data: { passwordHash: newHash },
        });

        // Revoke all refresh tokens (forces re-login across all devices!)
        await tx.refreshToken.updateMany({
          where: { userId, isRevoked: false },
          data: { isRevoked: true },
        });

        await tx.loginSession.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });

        // Log audit
        await tx.auditLog.create({
          data: {
            instituteId,
            userId,
            action: 'auth.change_password',
            tableName: 'users',
            recordId: userId,
          },
        });

        // Add activity
        await tx.activity.create({
          data: {
            instituteId,
            userId,
            message: `${user.firstName} ${user.lastName} changed their password`,
            activityType: 'PASSWORD_CHANGE',
          },
        });
      },
    );
  }
}
