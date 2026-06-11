import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdmissionDocumentsController } from './admission-documents.controller';
import { AdmissionDocumentsService } from './admission-documents.service';
import { AdmissionDocumentsRepository } from './repositories/admission-documents.repository';
import { AdmissionApplicationsModule } from '../admission-applications/admission-applications.module';

@Module({
  imports: [PrismaModule, AdmissionApplicationsModule],
  controllers: [AdmissionDocumentsController],
  providers: [AdmissionDocumentsService, AdmissionDocumentsRepository],
  exports: [AdmissionDocumentsService, AdmissionDocumentsRepository],
})
export class AdmissionDocumentsModule {}
