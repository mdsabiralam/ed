import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditService {
  async log(event: {
    user_id?: string;
    action: string;
    meta?: any;
  }) {
    console.log('[AUDIT]', {
      time: new Date().toISOString(),
      ...event,
    });

    /**
     * TODO (DB):
     * INSERT INTO audit_log (user_id, action, meta)
     */
  }
}
