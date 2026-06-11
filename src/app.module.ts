import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutesModule } from './modules/institutes/institutes.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AdmissionSessionsModule } from './modules/admission-sessions/admission-sessions.module';
import { LeadsModule } from './modules/leads/leads.module';
import { LeadFollowupsModule } from './modules/lead-followups/lead-followups.module';
import { AdmissionFormTemplatesModule } from './modules/admission-form-templates/admission-form-templates.module';
import { AdmissionApplicationsModule } from './modules/admission-applications/admission-applications.module';
import { AdmissionDocumentsModule } from './modules/admission-documents/admission-documents.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    InstitutesModule,
    UsersModule,
    JobsModule,
    AdmissionSessionsModule,
    LeadsModule,
    LeadFollowupsModule,
    AdmissionFormTemplatesModule,
    AdmissionApplicationsModule,
    AdmissionDocumentsModule,
  ],
})
export class AppModule {}
