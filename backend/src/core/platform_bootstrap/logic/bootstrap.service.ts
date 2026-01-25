import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

/* ---------- Infrastructure ---------- */
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'ed',
  password: 'edpass',
  database: 'ed_core',
});

const GRACE_DAYS = 7;

/* ---------- Utilities ---------- */
function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(token);
}

interface DecodedTokenPayload {
  user_id: string;
  role: string;
  institute_id: string;
  is_super_admin: boolean;
  exp?: number;
}

function decodeTokenPlaceholder(token: string): DecodedTokenPayload {
  return {
    user_id: '11111111-1111-1111-1111-111111111111',
    role: 'teacher',
    institute_id: '22222222-2222-2222-2222-222222222222',
    is_super_admin: false,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

/* ---------- Service ---------- */
@Injectable()
export class BootstrapService {
  async getBootstrapContext(token: string) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    /* ---------- A. Auth Foundation ---------- */
    if (!token) throw new UnauthorizedException('AUTH_NO_TOKEN');
    if (!isValidTokenFormat(token)) throw new UnauthorizedException('AUTH_INVALID_TOKEN');

    const decoded = decodeTokenPlaceholder(token);

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('AUTH_TOKEN_EXPIRED');
    }

    /* ---------- B. User Context ---------- */
    if (!decoded.institute_id) {
      throw new UnauthorizedException('INSTITUTE_CONTEXT_MISSING');
    }

    const userResult = await pool.query(
      'SELECT id, role, preferred_language FROM users WHERE id = $1',
      [decoded.user_id],
    );
    if (userResult.rows.length === 0) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const dbUser = userResult.rows[0];
    if (dbUser.role !== decoded.role) {
      throw new ForbiddenException('ROLE_MISMATCH');
    }

    const user = {
      id: dbUser.id,
      role: dbUser.role,
      language: dbUser.preferred_language,
      is_super_admin: decoded.is_super_admin,
    };

    /* ---------- C. Institute Scoping ---------- */
    const instituteResult = await pool.query(
      `SELECT institute_id, current_plan, subscription_status
       FROM institutes WHERE institute_id = $1`,
      [decoded.institute_id],
    );
    if (instituteResult.rows.length === 0) {
      throw new UnauthorizedException('INSTITUTE_NOT_FOUND');
    }

    const dbInstitute = instituteResult.rows[0];
    if (dbInstitute.subscription_status !== 'active') {
      throw new ForbiddenException('INSTITUTE_INACTIVE');
    }

    const institute = {
      id: dbInstitute.institute_id,
      plan: dbInstitute.current_plan,
    };

    /* ---------- E. Super Admin Bypass ---------- */
    let bypassReason: string | null = null;
    if (user.is_super_admin) {
      bypassReason = 'SUPER_ADMIN_BYPASS';
      console.log('[AUDIT]', { requestId, bypassReason });
    }

    /* ---------- D + F. Subscription Decision Tree ---------- */
    let subscriptionValid = true;

    if (!user.is_super_admin) {
      const subResult = await pool.query(
        `SELECT start_date, expiry_date
         FROM institute_subscriptions
         WHERE institute_id = $1
         ORDER BY expiry_date DESC
         LIMIT 1`,
        [decoded.institute_id],
      );

      if (subResult.rows.length === 0) {
        throw new ForbiddenException('SUBSCRIPTION_NOT_FOUND');
      }

      const { expiry_date } = subResult.rows[0];
      const expiryDate = new Date(expiry_date);
      const now = new Date();

      const isExpired = now > expiryDate;
      const graceEnd = new Date(expiryDate);
      graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);
      const graceValid = now <= graceEnd;

      if (isExpired && !graceValid) {
        throw new ForbiddenException('SUBSCRIPTION_EXPIRED');
      }

      subscriptionValid = !isExpired || graceValid;
    }

    /* ---------- G. Plugin Registry Resolution ---------- */
    const pluginResult = await pool.query(
      `SELECT plugin_key, min_plan_required
       FROM plugin_registry
       WHERE is_active = true`,
    );

    const allowed_plugins = pluginResult.rows
      .filter(p => p.min_plan_required <= institute.plan)
      .map(p => p.plugin_key);

    /* ---------- H. Response Assembly ---------- */
    const response = {
      user: {
        id: user.id,
        role: user.role,
        language: user.language,
      },
      institute: {
        id: institute.id,
        plan: institute.plan,
        subscription_valid: subscriptionValid,
      },
      allowed_plugins,
      meta: {
        request_id: requestId,
        bypass_reason: bypassReason,
        resolved_in_ms: Date.now() - startTime,
      },
    };

    /* ---------- J. Observability ---------- */
    console.log('[BOOTSTRAP_OK]', {
      requestId,
      user: user.id,
      institute: institute.id,
      plugins: allowed_plugins.length,
    });

    return response;
  }
}
