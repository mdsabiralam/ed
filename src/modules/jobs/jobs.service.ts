import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('audit-partition-queue') private readonly auditPartitionQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing background cron jobs...');
    await this.scheduleAuditPartitionCreator();
  }

  private async scheduleAuditPartitionCreator() {
    try {
      // Register repeatable job running daily at midnight (00:00)
      await this.auditPartitionQueue.add(
        'create-audit-partitions-job',
        {},
        {
          repeat: {
            pattern: '0 0 * * *',
          },
          jobId: 'audit-partition-creator', // Fixed job ID ensures uniqueness/prevents duplicate schedules
        },
      );
      this.logger.log('Successfully scheduled repeatable job: create-audit-partitions-job (daily at midnight)');
    } catch (error) {
      this.logger.error('Failed to schedule repeatable job: create-audit-partitions-job', error.stack);
    }
  }
}
