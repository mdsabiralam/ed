import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdmissionFormTemplatesService } from './admission-form-templates.service';
import { CreateAdmissionFormTemplateDto } from './dto/create-admission-form-template.dto';
import { UpdateAdmissionFormTemplateDto } from './dto/update-admission-form-template.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionFormTemplateEntity } from './entities/admission-form-template.entity';

@ApiTags('Admission Form Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('admission-form-templates')
export class AdmissionFormTemplatesController {
  constructor(private readonly service: AdmissionFormTemplatesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Create a dynamic form template layout for a class' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdmissionFormTemplateEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateAdmissionFormTemplateDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.createTemplate(createDto, actor);
    return {
      success: true,
      message: 'Admission form template created successfully',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Retrieve all templates under tenant boundaries' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdmissionFormTemplateEntity] })
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() actor: RequestContextUser) {
    const data = await this.service.findAll(actor);
    return {
      success: true,
      message: 'Admission form templates retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Get details of a form template' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionFormTemplateEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Admission form template retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Update form template schema configuration' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionFormTemplateEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdmissionFormTemplateDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.updateTemplate(id, updateDto, actor);
    return {
      success: true,
      message: 'Admission form template updated successfully',
      data,
    };
  }

  @Post(':id/activate')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Set this template layout as the active layout for its class' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionFormTemplateEntity })
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.activateTemplate(id, actor);
    return {
      success: true,
      message: 'Admission form template activated successfully',
      data,
    };
  }

  @Post(':id/deactivate')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Deactivate this template layout' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionFormTemplateEntity })
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.deactivateTemplate(id, actor);
    return {
      success: true,
      message: 'Admission form template deactivated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Soft-delete a form template layout' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Admission form template soft-deleted successfully',
    };
  }
}
