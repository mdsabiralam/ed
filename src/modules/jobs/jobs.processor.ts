import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('audit-partition-queue')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background job: ${job.name} (ID: ${job.id})`);

    switch (job.name) {
      case 'create-audit-partitions-job':
        return this.handleCreateAuditPartitions();
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCreateAuditPartitions() {
    this.logger.log('Running automated PostgreSQL partition generator for audit_logs...');
    try {
      // Execute database function to pre-generate monthly audit partitions
      await this.prismaService.$executeRaw`SELECT create_audit_log_partitions();`;
      this.logger.log('Automated audit partition generator completed successfully.');
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error('Failed to execute partition generator function:', error.stack || error);
      throw error;
    }
  }
}
