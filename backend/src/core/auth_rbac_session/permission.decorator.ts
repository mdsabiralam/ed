// c:\ed\backend\src\core\auth_rbac_session\permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (moduleKey: string, action: 'read' | 'write') => SetMetadata(PERMISSIONS_KEY, { moduleKey, action });