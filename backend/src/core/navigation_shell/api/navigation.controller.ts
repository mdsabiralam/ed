// core/navigation_shell/api/navigation.controller.ts

import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth_rbac_session/logic/jwt_auth.guard';
import { RbacGuard } from '../../auth_rbac_session/logic/rbac_guard';
import { RbacService } from '../../auth_rbac_session/logic/rbac.service';

@Controller('api/navigation')
export class NavigationController {
  constructor(
    private readonly rbacService: RbacService,
    // private readonly db: DbService (যেটা আপনি ব্যবহার করছেন)
  ) {}

  // 👈 এখানে আপনার দেওয়া method যাবে
}
