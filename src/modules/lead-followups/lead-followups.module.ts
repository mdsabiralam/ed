import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { LeadFollowupsController } from './lead-followups.controller';
import { LeadFollowupsService } from './lead-followups.service';
import { LeadFollowupsRepository } from './repositories/lead-followups.repository';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [PrismaModule, LeadsModule],
  controllers: [LeadFollowupsController],
  providers: [LeadFollowupsService, LeadFollowupsRepository],
  exports: [LeadFollowupsService, LeadFollowupsRepository],
})
export class LeadFollowupsModule {}
