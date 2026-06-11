import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdmissionApplicationsService } from './admission-applications.service';
import { CreateAdmissionApplicationDto } from './dto/create-admission-application.dto';
import { UpdateAdmissionApplicationDto } from './dto/update-admission-application.dto';
import { FilterAdmissionApplicationDto } from './dto/filter-admission-application.dto';
import { ConvertLeadDto } from '../leads/dto/convert-lead.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionApplicationEntity } from './entities/admission-application.entity';

@ApiTags('Admission Applications')
@Controller('admission-applications')
export class AdmissionApplicationsController {
  constructor(private readonly service: AdmissionApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new admission application' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdmissionApplicationEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateAdmissionApplicationDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.submitApplication(createDto, actor);
    return {
      success: true,
      message: 'Admission application submitted successfully',
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve all admission applications' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdmissionApplicationEntity] })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filters: FilterAdmissionApplicationDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const result = await this.service.findAll(filters, actor);
    return {
      success: true,
      message: 'Admission applications retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR', 'ACCOUNTANT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get details of an admission application' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionApplicationEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Admission application details retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admission application details or process status' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionApplicationEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdmissionApplicationDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.update(id, updateDto, actor);
    return {
      success: true,
      message: 'Admission application updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete an admission application' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Admission application soft-deleted successfully',
    };
  }

  @Post('convert-lead/:leadId')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert a registered lead into an admission application draft' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdmissionApplicationEntity })
  @HttpCode(HttpStatus.CREATED)
  async convertLead(
    @Param('leadId') leadId: string,
    @Body() convertLeadDto: ConvertLeadDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.convertLeadToApplication(leadId, convertLeadDto, actor);
    return {
      success: true,
      message: 'Lead converted to admission application successfully',
      data,
    };
  }

  @Post('setup-password')
  @ApiOperation({ summary: 'Activate a guardian account by setting password via invitation token' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async setupPassword(@Body() setupDto: SetupPasswordDto) {
    await this.service.activateGuardianAccount(setupDto.token, setupDto.password);
    return {
      success: true,
      message: 'Password configured successfully. Guardian account activated.',
    };
  }
}
