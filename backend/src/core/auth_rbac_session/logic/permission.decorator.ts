import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RbacGuard
 */
export const PERMISSION_KEY = 'permission';

/**
 * Allowed permission actions
 */
export type PermissionAction = 'read' | 'write';

/**
 * Permission metadata shape
 */
export interface PermissionMeta {
  module: string;
  action: PermissionAction;
}

/**
 * Permission decorator
 * Usage:
 * @Permission('attendance', 'read')
 */
export const Permission = (
  module: string,
  action: PermissionAction,
) =>
  SetMetadata(PERMISSION_KEY, {
    module,
    action,
  } as PermissionMeta);
