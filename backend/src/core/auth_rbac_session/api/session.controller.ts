import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../logic/audit.service';

interface RefreshSessionDto {
  refresh_token: string;
  device_id: string;
}

@Controller('api/auth')
export class SessionController {
  constructor(
    private readonly audit: AuditService,
  ) {}

  /**
   * 🔄 POST /api/auth/refresh
   * Refresh token rotation + expiry check + audit
   */
  @Post('refresh')
  async refreshSession(@Body() dto: RefreshSessionDto) {
    /**
     * TODO (DB QUERY):
     * SELECT * FROM sessions
     * WHERE refresh_token = dto.refresh_token
     *   AND device_id = dto.device_id
     */
    const session = {
      session_id: 'S123',
      user_id: 'U123',
      role: 'teacher',
      institute_id: 'INS001',
      device_id: dto.device_id,
      refresh_token: dto.refresh_token,
      expires_at: new Date(
        Date.now() + 1000 * 60 * 10, // demo: valid
      ),
    };

    if (!session) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    /**
     * ⏰ Session expiry check
     */
    if (session.expires_at < new Date()) {
      throw new UnauthorizedException(
        'Session expired',
      );
    }

    /**
     * 🔁 Refresh token rotation
     */
    const newRefreshToken = randomUUID();

    /**
     * TODO (DB UPDATE):
     * UPDATE sessions
     * SET refresh_token = newRefreshToken
     * WHERE session_id = session.session_id
     */

    /**
     * ✅ Audit: refresh token rotated
     */
    await this.audit.log({
      user_id: session.user_id,
      action: 'refresh_token_rotated',
      meta: {
        device_id: session.device_id,
        session_id: session.session_id,
      },
    });

    return {
      refresh_token: newRefreshToken,
      expires_at: session.expires_at,
    };
  }
}
