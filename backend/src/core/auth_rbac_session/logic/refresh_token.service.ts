import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RefreshTokenService {
  /**
   * Issue a new refresh token (rotating)
   */
  async issue(userId: string, deviceId: string) {
    const refreshToken = randomUUID();

    /**
     * TODO (DB):
     * INSERT INTO sessions (session_id, user_id, device_id, expires_at)
     */
    return {
      refresh_token: refreshToken,
      expires_in: '7d',
    };
  }

  /**
   * Validate & rotate refresh token
   */
  async rotate(oldToken: string) {
    /**
     * TODO (DB):
     * SELECT session WHERE session_id = oldToken AND not expired
     */
    const sessionExists = true; // demo

    if (!sessionExists) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    /**
     * TODO (DB):
     * DELETE old session
     */
    const newToken = randomUUID();

    /**
     * TODO (DB):
     * INSERT new session
     */
    return {
      refresh_token: newToken,
      expires_in: '7d',
    };
  }
}
