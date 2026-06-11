import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestContextUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'access_secret_123_change_me_in_prod',
    });
  }

  async validate(payload: any): Promise<RequestContextUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      instituteId: payload.instituteId,
      branchId: payload.branchId || null,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
