import { Controller, Get, Headers } from '@nestjs/common';
import { BootstrapService } from '../logic/bootstrap.service';

@Controller('api/bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get('context')
  async getContext(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.bootstrapService.getBootstrapContext(token);
  }
}
