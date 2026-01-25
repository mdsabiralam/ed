// core/auth_rbac_session/api/auth.controller.ts

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtAuthGuard } from './logic/jwt_auth.guard';
import { TokenFactory } from './logic/token_factory';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly tokenFactory: TokenFactory,
  ) {}

  /**
   * LOGIN (Secure)
   */
  @Post('login')
  async login(@Body() dto: any) {
    /**
     * TODO (DB):
     * SELECT * FROM auth_users WHERE identifier = dto.identifier
     */
    const user = {
      user_id: 'U123',
      password_hash: await bcrypt.hash('1234', 10), // demo
      role: 'teacher',
      institute_id: 'INS001',
      is_active: true,
    };

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid login');
    }

    const passwordMatch = await bcrypt.compare(
      dto.secret,
      user.password_hash,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid login');
    }

    /**
     * 🔐 Token issuance delegated to TokenFactory
     */
    return this.tokenFactory.issueTokens({
      user_id: user.user_id,
      role: user.role,
      institute_id: user.institute_id,
      device_id: dto.device_id || 'web',
    });
  }

  /**
   * CURRENT USER (Protected)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return {
      user_id: req.user.user_id,
      role: req.user.role,
      institute_id: req.user.institute_id,
    };
  }
}
