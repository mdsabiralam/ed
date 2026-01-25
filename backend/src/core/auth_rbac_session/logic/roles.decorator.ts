import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RbacGuard
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 * Usage:
 * @Roles('admin', 'teacher')
 */
export const Roles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);
