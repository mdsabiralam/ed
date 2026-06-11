import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeadFollowupsService } from './lead-followups.service';
import { CreateLeadFollowupDto } from './dto/create-lead-followup.dto';
import { UpdateLeadFollowupDto } from './dto/update-lead-followup.dto';
import { FilterLeadFollowupDto } from './dto/filter-lead-followup.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { LeadFollowupEntity } from './entities/lead-followup.entity';

@ApiTags('Lead Followups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('lead-followups')
export class LeadFollowupsController {
  constructor(private readonly service: LeadFollowupsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Log a new callback/followup action for a lead' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LeadFollowupEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateLeadFollowupDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.create(createDto, actor);
    return {
      success: true,
      message: 'Lead follow-up logged successfully',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'List all logged follow-up interactions' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeadFollowupEntity] })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filters: FilterLeadFollowupDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const result = await this.service.findAll(filters, actor);
    return {
      success: true,
      message: 'Lead follow-ups retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Get details of a follow-up action' })
  @ApiResponse({ status: HttpStatus.OK, type: LeadFollowupEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Lead follow-up details retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Update follow-up log information' })
  @ApiResponse({ status: HttpStatus.OK, type: LeadFollowupEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeadFollowupDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.update(id, updateDto, actor);
    return {
      success: true,
      message: 'Lead follow-up updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Delete a follow-up log' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Lead follow-up log deleted successfully',
    };
  }
}
