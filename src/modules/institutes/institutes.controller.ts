import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { InstitutesService } from './institutes.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('institutes')
export class InstitutesController {
  constructor(private readonly institutesService: InstitutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createInstituteDto: CreateInstituteDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.institutesService.create(createInstituteDto, actor);
    return {
      success: true,
      message: 'Institute provisioned successfully with initial admin setup',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() actor: RequestContextUser) {
    const data = await this.institutesService.findAll(actor);
    return {
      success: true,
      message: 'Institutes retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @CurrentUser() actor: RequestContextUser) {
    const data = await this.institutesService.findOne(id, actor);
    return {
      success: true,
      message: 'Institute retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateInstituteDto: UpdateInstituteDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.institutesService.update(id, updateInstituteDto, actor);
    return {
      success: true,
      message: 'Institute configurations updated successfully',
      data,
    };
  }
}
