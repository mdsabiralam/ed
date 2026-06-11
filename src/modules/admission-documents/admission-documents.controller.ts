import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdmissionDocumentsService } from './admission-documents.service';
import { CreateAdmissionDocumentDto } from './dto/create-admission-document.dto';
import { UpdateAdmissionDocumentDto } from './dto/update-admission-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { AdmissionDocumentEntity } from './entities/admission-document.entity';

@ApiTags('Admission Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('admission-documents')
export class AdmissionDocumentsController {
  constructor(private readonly service: AdmissionDocumentsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Upload/submit a candidate document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateAdmissionDocumentDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.create(createDto, actor);
    return {
      success: true,
      message: 'Admission document submitted successfully',
      data,
    };
  }

  @Get('application/:applicationId')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Retrieve all documents submitted for an application' })
  @ApiResponse({ status: HttpStatus.OK, type: [AdmissionDocumentEntity] })
  @HttpCode(HttpStatus.OK)
  async findAllByApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findAllByApplication(applicationId, actor);
    return {
      success: true,
      message: 'Admission documents retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Get details of a document' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Admission document details retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Update document information' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdmissionDocumentDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.update(id, updateDto, actor);
    return {
      success: true,
      message: 'Admission document updated successfully',
      data,
    };
  }

  @Post(':id/verify')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Mark document verification as approved/verified' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.verifyDocument(id, actor);
    return {
      success: true,
      message: 'Admission document marked as VERIFIED',
      data,
    };
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Mark document verification as rejected' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @Body('rejectedReason') rejectedReason: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.rejectDocument(id, rejectedReason || 'Rejection reason unspecified', actor);
    return {
      success: true,
      message: 'Admission document marked as REJECTED',
      data,
    };
  }

  @Post(':id/reupload')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Request candidate to re-upload the document' })
  @ApiResponse({ status: HttpStatus.OK, type: AdmissionDocumentEntity })
  @HttpCode(HttpStatus.OK)
  async requestReupload(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.requestReupload(id, actor);
    return {
      success: true,
      message: 'Re-upload request initiated. Document reset to PENDING.',
      data,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Soft-delete a document record' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Admission document soft-deleted successfully',
    };
  }
}
