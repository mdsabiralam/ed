import { Injectable } from '@nestjs/common';
import { RbacCache } from './rbac.cache';

export type PermissionAction = 'read' | 'write';

interface RolePermission {
  module_key: string;
  read: boolean;
  write: boolean;
}

@Injectable()
export class RbacService {
  constructor(private readonly cache: RbacCache) {}

  /**
   * 🔐 RBAC Permission Check
   * - Redis cached
   * - Wildcard (*) supported
   * - Module-wise permission
   * - SaaS-ready (instituteId isolated)
   */
  async hasPermission(
    role: string,
    moduleKey: string,
    action: PermissionAction,
    instituteId?: string,
  ): Promise<boolean> {
    /**
     * 1️⃣ Redis cache lookup
     */
    const cached = await this.cache.get(
      role,
      moduleKey,
      action,
      instituteId,
    );
    if (cached !== null) {
      return cached;
    }

    /**
     * 2️⃣ TEMP MOCK DB (replace with real DB later)
     * Mirrors role_permissions table
     */
    const mockDb: Record<string, RolePermission[]> = {
      admin: [
        { module_key: '*', read: true, write: true },
      ],
      teacher: [
        { module_key: 'attendance', read: true, write: false },
        { module_key: 'dashboard', read: true, write: false },
      ],
      student: [
        { module_key: 'dashboard', read: true, write: false },
      ],
    };

    const permissions = mockDb[role];

    if (!permissions) {
      await this.cache.set(
        role,
        moduleKey,
        action,
        false,
        instituteId,
      );
      return false;
    }

    /**
     * 3️⃣ Wildcard (*) permission
     */
    const wildcard = permissions.find(
      (p) => p.module_key === '*',
    );
    if (wildcard) {
      const allowed = wildcard[action] === true;
      await this.cache.set(
        role,
        moduleKey,
        action,
        allowed,
        instituteId,
      );
      return allowed;
    }

    /**
     * 4️⃣ Module-specific permission
     */
    const modulePermission = permissions.find(
      (p) => p.module_key === moduleKey,
    );

    const allowed = modulePermission
      ? modulePermission[action] === true
      : false;

    /**
     * 5️⃣ Cache result
     */
    await this.cache.set(
      role,
      moduleKey,
      action,
      allowed,
      instituteId,
    );

    return allowed; // ✅ mandatory final return
  }
}
