import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { sign, SignOptions } from 'jsonwebtoken';
import { RefreshTokenService } from './refresh_token.service';

interface TokenPayload {
  user_id: string;
  role: string;
  institute_id: string;
  device_id: string;
}

@Injectable()
export class TokenFactory {
  constructor(
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * 🔐 Issue Access + Refresh Tokens
   */
  async issueTokens(payload: TokenPayload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET not configured',
      );
    }

    const expiresIn: SignOptions['expiresIn'] =
      (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ??
      '15m';

    /**
     * ✅ Access Token (JWT)
     */
    const access_token = sign(
      {
        user_id: payload.user_id,
        role: payload.role,
        institute_id: payload.institute_id,
      },
      secret,
      { expiresIn },
    );

    /**
     * 🔁 Refresh Token delegation
     */
    const refreshSession =
      await this.refreshTokenService.issue(
        payload.user_id,
        payload.device_id,
      );

    return {
      access_token,
      refresh_token: refreshSession.refresh_token,
      expires_in: refreshSession.expires_in, // ✅ FIXED
    };
  }
}
