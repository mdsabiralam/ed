import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './logic/rbac.service';
import { PERMISSIONS_KEY } from './permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<{ moduleKey: string, action: 'read' | 'write' }>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // Assuming the user object has a 'role' property.
    // You might need to adjust this depending on your auth implementation.
    if (!user || !user.role) {
      return false;
    }

    return this.rbacService.hasPermission(
      user.role,
      requiredPermissions.moduleKey,
      requiredPermissions.action,
    );
  }
}
