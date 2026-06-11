import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdmissionApplicationsController } from './admission-applications.controller';
import { AdmissionApplicationsService } from './admission-applications.service';
import { AdmissionApplicationsRepository } from './repositories/admission-applications.repository';
import { ApplicationNumberService } from './services/application-number.service';
import { AdmissionTimelineService } from './services/admission-timeline.service';
import { AdmissionFormTemplatesModule } from '../admission-form-templates/admission-form-templates.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [PrismaModule, AdmissionFormTemplatesModule, LeadsModule],
  controllers: [AdmissionApplicationsController],
  providers: [
    AdmissionApplicationsService,
    AdmissionApplicationsRepository,
    ApplicationNumberService,
    AdmissionTimelineService,
  ],
  exports: [
    AdmissionApplicationsService,
    AdmissionApplicationsRepository,
    ApplicationNumberService,
    AdmissionTimelineService,
  ],
})
export class AdmissionApplicationsModule {}
