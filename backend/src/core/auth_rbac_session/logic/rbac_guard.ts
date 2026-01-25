import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import {
  PERMISSION_KEY,
  PermissionMeta,
} from './permission.decorator';
import { RbacService } from './rbac.service';
import { AuditService } from './audit.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    /**
     * 🔐 Must be authenticated first
     */
    if (!user) {
      throw new UnauthorizedException(
        'Authentication required',
      );
    }

    /**
     * 🔑 Super Admin bypass (full access)
     */
    if (user.role === 'super_admin') {
      return true;
    }

    /**
     * 1️⃣ Role-based check (@Roles)
     */
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (
      requiredRoles &&
      !requiredRoles.includes(user.role)
    ) {
      await this.audit.log({
        user_id: user.user_id,
        action: 'permission_denied',
        meta: {
          reason: 'role_not_allowed',
          role: user.role,
          requiredRoles,
        },
      });

      throw new ForbiddenException(
        `Role '${user.role}' not allowed`,
      );
    }

    /**
     * 2️⃣ Permission-based check (@Permission)
     */
    const permission =
      this.reflector.getAllAndOverride<PermissionMeta>(
        PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );

    // No permission decorator → allow
    if (!permission) {
      return true;
    }

    const allowed =
      await this.rbacService.hasPermission(
        user.role,
        permission.module,
        permission.action,
        user.institute_id,
      );

    if (!allowed) {
      await this.audit.log({
        user_id: user.user_id,
        action: 'permission_denied',
        meta: {
          module: permission.module,
          action: permission.action,
          role: user.role,
        },
      });

      throw new ForbiddenException(
        `No ${permission.action} access on ${permission.module}`,
      );
    }

    return true;
  }
}
