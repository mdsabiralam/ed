import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdmissionSessionsService } from './admission-sessions.service';
import { CreateAdmissionSessionDto } from './dto/create-admission-session.dto';
import { UpdateAdmissionSessionDto } from './dto/update-admission-session.dto';
import { FilterAdmissionSessionDto } from './dto/filter-admission-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionSessionEntity } from './entities/admission-session.entity';

@ApiTags('Admission Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('admission-sessions')
export class AdmissionSessionsController {
  constructor(private readonly service: AdmissionSessionsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Create a new admission intake session cycle' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdmissionSessionEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateAdmissionSessionDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.create(createDto, actor);
    return {
      success: true,
      message: 'Admission session created successfully',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Retrieve list of all active admission sessions' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdmissionSessionEntity] })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filters: FilterAdmissionSessionDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const result = await this.service.findAll(filters, actor);
    return {
      success: true,
      message: 'Admission sessions retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get details of an admission session' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionSessionEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Admission session retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Update admission session configuration' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionSessionEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdmissionSessionDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.update(id, updateDto, actor);
    return {
      success: true,
      message: 'Admission session updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Soft-delete an admission session' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Admission session soft-deleted successfully',
    };
  }
}
