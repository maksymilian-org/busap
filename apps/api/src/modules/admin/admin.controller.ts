import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@busap/shared';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AssignCompanyRoleDto } from './dto/assign-role.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Dashboard ====================

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== Users ====================

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users with filtering' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'systemRole', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listUsers(
    @Query('search') search?: string,
    @Query('systemRole') systemRole?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listUsers({
      search,
      systemRole,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user manually' })
  async createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Put('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateUser(id, dto, {
      isSuperadmin: user.isSuperadmin,
    });
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a user (soft delete)' })
  async deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteUser(id, {
      id: user.id,
      isSuperadmin: user.isSuperadmin,
    });
  }

  // ==================== Invitations ====================

  @Get('invitations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invitations' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'accepted', 'expired'] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listInvitations(
    @Query('status') status?: 'pending' | 'accepted' | 'expired',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listInvitations({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('invitations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create and send an invitation' })
  async createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.createInvitation(dto, user.id);
  }

  @Get('invitations/verify')
  @Public()
  @ApiOperation({ summary: 'Verify an invitation token and get invitation details' })
  @ApiQuery({ name: 'token', required: true })
  async verifyInvitation(@Query('token') token: string) {
    return this.adminService.verifyInvitation(token);
  }

  @Post('invitations/accept')
  @Public()
  @ApiOperation({ summary: 'Accept an invitation and create account' })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.adminService.acceptInvitation(dto);
  }

  @Delete('invitations/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  async revokeInvitation(@Param('id') id: string) {
    return this.adminService.revokeInvitation(id);
  }

  // ==================== Company Roles ====================

  @Post('roles')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a company role to a user' })
  async assignCompanyRole(@Body() dto: AssignCompanyRoleDto) {
    return this.adminService.assignCompanyRole(dto);
  }

  @Delete('roles/:userId/:companyId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a company role from a user' })
  async removeCompanyRole(
    @Param('userId') userId: string,
    @Param('companyId') companyId: string,
  ) {
    return this.adminService.removeCompanyRole(userId, companyId);
  }
}
