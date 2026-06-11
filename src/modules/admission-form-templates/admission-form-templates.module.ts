import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AdmissionFormTemplatesController } from './admission-form-templates.controller';
import { AdmissionFormTemplatesService } from './admission-form-templates.service';
import { AdmissionFormTemplatesRepository } from './repositories/admission-form-templates.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AdmissionFormTemplatesController],
  providers: [AdmissionFormTemplatesService, AdmissionFormTemplatesRepository],
  exports: [AdmissionFormTemplatesService, AdmissionFormTemplatesRepository],
})
export class AdmissionFormTemplatesModule {}
