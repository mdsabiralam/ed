import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify, TokenExpiredError } from 'jsonwebtoken';

interface JwtPayload {
  user_id: string;
  role: string;
  institute_id?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    /**
     * 🔐 Authorization header check
     */
    if (!authHeader) {
      throw new UnauthorizedException(
        'Authorization header missing',
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization format must be: Bearer <token>',
      );
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('JWT token missing');
    }

    try {
      /**
       * ✅ JWT verify (includes expiry check)
       */
      const payload = verify(
        token,
        process.env.JWT_SECRET as string,
      ) as JwtPayload;

      /**
       * 🔎 Mandatory payload validation
       */
      if (!payload.user_id || !payload.role) {
        throw new UnauthorizedException(
          'Invalid token payload',
        );
      }

      /**
       * 📎 Attach normalized user object
       * Used by RBAC & Institute guards
       */
      request.user = {
        user_id: payload.user_id,
        role: payload.role,
        institute_id: payload.institute_id,
      };

      return true;
    } catch (err) {
      /**
       * ⏰ Token expiry handling
       */
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'JWT token expired',
        );
      }

      throw new UnauthorizedException(
        'JWT invalid',
      );
    }
  }
}
