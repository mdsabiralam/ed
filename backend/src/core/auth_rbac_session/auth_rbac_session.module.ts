import { Module } from '@nestjs/common';

import { AuthController } from './api/auth.controller';
import { SessionController } from './api/session.controller';

import { JwtAuthGuard } from './logic/jwt_auth.guard';
import { RbacGuard } from './logic/rbac_guard';
import { RbacService } from './logic/rbac.service';
import { RbacCache } from './logic/rbac.cache';
import { AuditService } from './logic/audit.service';
import { TokenFactory } from './logic/token_factory';

@Module({
  controllers: [
    AuthController,
    SessionController,
  ],
  providers: [
    JwtAuthGuard,
    RbacGuard,
    RbacService,
    RbacCache,
    AuditService,
    TokenFactory,
  ],
  exports: [
    RbacService, // 🔓 used by Navigation (Plug-3)
  ],
})
export class AuthRbacSessionModule {}
