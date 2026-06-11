import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadDto } from './dto/filter-lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';
import { LeadEntity } from './entities/lead.entity';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Register a prospective lead candidate' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LeadEntity })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateLeadDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.create(createDto, actor);
    return {
      success: true,
      message: 'Lead inquiry registered successfully',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Fetch all active leads under tenant boundaries' })
  @ApiResponse({ status: HttpStatus.OK, type: [LeadEntity] })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filters: FilterLeadDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const result = await this.service.findAll(filters, actor);
    return {
      success: true,
      message: 'Leads directory retrieved successfully',
      ...result,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Get details of a lead' })
  @ApiResponse({ status: HttpStatus.OK, type: LeadEntity })
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.findOne(id, actor);
    return {
      success: true,
      message: 'Lead details retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER', 'COUNSELLOR')
  @ApiOperation({ summary: 'Update lead details' })
  @ApiResponse({ status: HttpStatus.OK, type: LeadEntity })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeadDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.service.update(id, updateDto, actor);
    return {
      success: true,
      message: 'Lead information updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_OWNER', 'PRINCIPAL', 'ADMISSION_MANAGER')
  @ApiOperation({ summary: 'Soft-delete a lead inquiry' })
  @ApiResponse({ status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: RequestContextUser,
  ) {
    await this.service.remove(id, actor);
    return {
      success: true,
      message: 'Lead inquiry soft-deleted successfully',
    };
  }
}
