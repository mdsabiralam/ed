import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs queries inside a PostgreSQL transaction block with Row-Level Security (RLS) contexts set locally.
   * This prevents tenant context leak between pooled connections.
   */
  async runWithTenantContext<T>(
    context: { instituteId: string | null; userId: string | null; userRole: string | null; branchId?: string | null; bypassRls?: boolean },
    cb: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      const instituteIdVal = context.instituteId ? `'${context.instituteId}'` : "''";
      const userIdVal = context.userId ? `'${context.userId}'` : "''";
      const roleVal = context.userRole ? `'${context.userRole}'` : "''";
      const branchIdVal = context.branchId ? `'${context.branchId}'` : "''";
      const bypassRlsVal = context.bypassRls ? "'true'" : "'false'";

      // Inject tenant context into local session configurations
      await tx.$executeRawUnsafe(`SET LOCAL app.current_institute_id = ${instituteIdVal};`);
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = ${userIdVal};`);
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_role = ${roleVal};`);
      await tx.$executeRawUnsafe(`SET LOCAL app.current_branch_id = ${branchIdVal};`);
      await tx.$executeRawUnsafe(`SET LOCAL app.bypass_rls = ${bypassRlsVal};`);

      return cb(tx);
    });
  }
}
