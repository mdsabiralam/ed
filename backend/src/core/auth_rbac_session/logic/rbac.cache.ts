import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RbacCache implements OnModuleDestroy {
  private redis: Redis;

  private ttlSeconds = 600; // 10 minutes

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  private key(role: string, module: string, action: string) {
    return `rbac:${role}:${module}:${action}`;
  }

  async get(
    role: string,
    module: string,
    action: string,
  ): Promise<boolean | null> {
    const value = await this.redis.get(
      this.key(role, module, action),
    );
    if (value === null) return null;
    return value === '1';
  }

  async set(
    role: string,
    module: string,
    action: string,
    allowed: boolean,
  ) {
    await this.redis.set(
      this.key(role, module, action),
      allowed ? '1' : '0',
      'EX',
      this.ttlSeconds,
    );
  }

  /**
   * 🔥 RBAC Cache Invalidation
   */

  // Invalidate single permission
  async invalidate(
    role: string,
    module: string,
    action: string,
  ) {
    await this.redis.del(
      this.key(role, module, action),
    );
  }

  // Invalidate all permissions of a role
  async invalidateRole(role: string) {
    const keys = await this.redis.keys(`rbac:${role}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Invalidate everything (admin use only)
  async invalidateAll() {
    const keys = await this.redis.keys('rbac:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
