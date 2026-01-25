import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UnauthorizedException,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuditService } from '../logic/audit.service';
import { JwtAuthGuard } from 'src/core/auth_rbac_session/logic/jwt_auth.guard';
import { RbacGuard } from 'src/core/auth_rbac_session/logic/rbac_guard';
import { Roles } from 'src/core/auth_rbac_session/logic/roles.decorator';
import { TokenFactory } from 'src/core/auth_rbac_session/logic/token_factory';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly tokenFactory: TokenFactory,
    private readonly audit: AuditService,
  ) {}

  /**
   * 🔐 POST /api/auth/login
   * Secure Login + Audit
   */
  @Post('login')
  async login(@Body() dto: any) {
    /**
     * TODO (DB):
     * SELECT * FROM auth_users WHERE identifier = dto.identifier
     */
    const user = {
      user_id: 'U123',
      password_hash: await bcrypt.hash('1234', 10), // demo only
      role: 'teacher',
      institute_id: 'INS001',
      is_active: true,
    };

    if (!user || !user.is_active) {
      await this.audit.log({
        action: 'login_failed',
        meta: { identifier: dto.identifier },
      });
      throw new UnauthorizedException('Invalid login');
    }

    const passwordMatch = await bcrypt.compare(
      dto.secret,
      user.password_hash,
    );

    if (!passwordMatch) {
      await this.audit.log({
        action: 'login_failed',
        meta: { identifier: dto.identifier },
      });
      throw new UnauthorizedException('Invalid login');
    }

    /**
     * ✅ Audit: login success
     */
    await this.audit.log({
      user_id: user.user_id,
      action: 'login_success',
    });

    /**
     * 🔐 Tokens issued ONLY via TokenFactory
     */
    return this.tokenFactory.issueTokens({
      user_id: user.user_id,
      role: user.role,
      institute_id: user.institute_id,
      device_id: dto.device_id || 'web',
    });
  }

  /**
   * 👤 GET /api/auth/me
   * JWT + RBAC protected
   */
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('teacher', 'admin', 'student')
  @Get('me')
  me(@Req() req: any) {
    return {
      user_id: req.user.user_id,
      role: req.user.role,
      institute_id: req.user.institute_id,
    };
  }

  /**
   * 🔄 POST /api/auth/switch-role
   * Role Switch + Audit
   */
  @UseGuards(JwtAuthGuard)
  @Post('switch-role')
  async switchRole(
    @Req() req: any,
    @Body() body: { role: string; device_id?: string },
  ) {
    /**
     * TODO (DB):
     * SELECT role FROM user_roles WHERE user_id = req.user.user_id
     */
    const allowedRoles = ['teacher', 'admin']; // demo

    if (!allowedRoles.includes(body.role)) {
      throw new ForbiddenException(
        'Role not assigned to user',
      );
    }

    /**
     * ✅ Audit: role switch
     */
    await this.audit.log({
      user_id: req.user.user_id,
      action: 'role_switch',
      meta: { role: body.role },
    });

    return this.tokenFactory.issueTokens({
      user_id: req.user.user_id,
      role: body.role,
      institute_id: req.user.institute_id,
      device_id: body.device_id || 'web',
    });
  }
}
