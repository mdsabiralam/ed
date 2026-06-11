import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RequestContextUser } from '../decorators/current-user.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContextUser | undefined;

    if (user) {
      // Attach tenant boundaries to the request object for Prisma Service injection
      request.instituteId = user.instituteId;
      request.branchId = user.branchId;
      request.userRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'GUEST';
    }

    return true;
  }
}
