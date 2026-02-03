import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UpdateUserInput, UserRoleType } from '@busap/shared';

class AssignRoleDto {
  companyId: string;
  role: UserRoleType;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query('companyId') companyId?: string) {
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() data: UpdateUserInput) {
    return this.usersService.update(id, data);
  }

  @Post(':id/roles')
  @Roles(UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(id, dto.companyId, dto.role);
  }

  @Delete(':id/roles/:companyId')
  @Roles(UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Remove user role from company' })
  async removeRole(
    @Param('id') id: string,
    @Param('companyId') companyId: string,
  ) {
    return this.usersService.removeRole(id, companyId);
  }

  @Get('drivers/company/:companyId')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all drivers for a company' })
  async getDrivers(@Param('companyId') companyId: string) {
    return this.usersService.getDriversByCompany(companyId);
  }
}
