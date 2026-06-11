import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, RequestContextUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.usersService.create(createUserDto, actor);
    return {
      success: true,
      message: 'User account and profile provisioned successfully',
      data,
    };
  }

  @Get()
  @Permissions('users.read')
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() actor: RequestContextUser) {
    const data = await this.usersService.findAll(actor);
    return {
      success: true,
      message: 'User directory retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Permissions('users.read')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string, @CurrentUser() actor: RequestContextUser) {
    const data = await this.usersService.findOne(id, actor);
    return {
      success: true,
      message: 'User details retrieved successfully',
      data,
    };
  }

  @Put(':id')
  @Permissions('users.update')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: RequestContextUser,
  ) {
    const data = await this.usersService.update(id, updateUserDto, actor);
    return {
      success: true,
      message: 'User profile updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Permissions('users.delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() actor: RequestContextUser) {
    await this.usersService.remove(id, actor);
    return {
      success: true,
      message: 'User profile soft-deleted successfully. Active sessions revoked.',
    };
  }
}
