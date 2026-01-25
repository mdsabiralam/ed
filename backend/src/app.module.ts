import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlatformBootstrapModule } from './core/platform_bootstrap/platform-bootstrap.module';
import { AuthRbacSessionModule } from './core/auth_rbac_session/auth_rbac_session.module';

@Module({
  imports: [PlatformBootstrapModule, AuthRbacSessionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
