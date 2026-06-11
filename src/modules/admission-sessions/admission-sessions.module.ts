import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdmissionSessionsController } from './admission-sessions.controller';
import { AdmissionSessionsService } from './admission-sessions.service';
import { AdmissionSessionsRepository } from './repositories/admission-sessions.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionSessionsController],
  providers: [AdmissionSessionsService, AdmissionSessionsRepository],
  exports: [AdmissionSessionsService, AdmissionSessionsRepository],
})
export class AdmissionSessionsModule {}
