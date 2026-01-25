import { Module } from '@nestjs/common';
import { BootstrapService } from './logic/bootstrap.service';
import { BootstrapController } from './api/bootstrap.controller';

@Module({
  controllers: [BootstrapController],
  providers: [BootstrapService],
})
export class PlatformBootstrapModule {}
