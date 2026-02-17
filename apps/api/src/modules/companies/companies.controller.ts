import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CreateCompanyInput, UpdateCompanyInput } from '@busap/shared';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  async findById(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get company statistics' })
  async getStats(@Param('id') id: string) {
    return this.companiesService.getStats(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  async create(@Body() data: CreateCompanyInput, @CurrentUser() user: any) {
    // Use user.id from JWT token (dbUser might not be set without @Roles)
    const userId = user.dbUser?.id || user.id;
    return this.companiesService.create(data, userId);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update company' })
  async update(@Param('id') id: string, @Body() data: UpdateCompanyInput) {
    return this.companiesService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete company (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.companiesService.delete(id);
  }

  // ==================== Company Members ====================

  @Get(':id/members')
  @ApiOperation({ summary: 'Get company members' })
  async getMembers(@Param('id') id: string) {
    return this.companiesService.getMembers(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to company' })
  async addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string },
    @CurrentUser() user: any,
  ) {
    await this.checkCompanyAccess(id, user);
    return this.companiesService.addMember(id, body.userId, body.role);
  }

  @Put(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { role: string },
    @CurrentUser() user: any,
  ) {
    await this.checkCompanyAccess(id, user);
    return this.companiesService.updateMemberRole(id, userId, body.role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from company' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    await this.checkCompanyAccess(id, user);
    return this.companiesService.removeMember(id, userId);
  }

  @Get(':id/available-users')
  @ApiOperation({ summary: 'Search users available to add to company' })
  @ApiQuery({ name: 'search', required: false })
  async getAvailableUsers(
    @Param('id') id: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    await this.checkCompanyAccess(id, user);
    return this.companiesService.getAvailableUsers(id, search);
  }

  // ==================== Public Endpoints ====================

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get company by slug (public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlugPublic(slug);
  }

  @Get('slug/:slug/routes')
  @Public()
  @ApiOperation({ summary: 'Get company routes with stops (public)' })
  async getPublicRoutes(@Param('slug') slug: string) {
    return this.companiesService.getPublicRoutes(slug);
  }

  @Get('slug/:slug/departures')
  @Public()
  @ApiOperation({ summary: 'Get nearest departures (public)' })
  @ApiQuery({ name: 'hours', required: false })
  async getPublicDepartures(
    @Param('slug') slug: string,
    @Query('hours') hours?: string,
  ) {
    const windowHours = hours ? parseInt(hours, 10) : 24;
    return this.companiesService.getPublicDepartures(slug, windowHours);
  }

  @Get('slug/:slug/news')
  @Public()
  @ApiOperation({ summary: 'Get published news (public)' })
  async getPublicNews(@Param('slug') slug: string) {
    return this.companiesService.getPublicNews(slug);
  }

  private async checkCompanyAccess(companyId: string, user: any) {
    // Get user data - either from dbUser (set by RolesGuard) or fetch from DB
    let systemRole: string;
    let userId: string;
    let companyUsers: { companyId: string; role: string; isActive: boolean }[] = [];

    if (user.dbUser) {
      systemRole = user.dbUser.systemRole;
      userId = user.dbUser.id;
      companyUsers = user.dbUser.companyUsers || [];
    } else {
      // RolesGuard didn't run, fetch user from DB
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          systemRole: true,
          companyUsers: {
            where: { isActive: true },
            select: { companyId: true, role: true, isActive: true },
          },
        },
      });
      if (!dbUser) {
        throw new ForbiddenException('User not found');
      }
      systemRole = dbUser.systemRole;
      userId = dbUser.id;
      companyUsers = dbUser.companyUsers;
    }

    // Superadmin and admin have access to all companies
    if (systemRole === 'superadmin' || systemRole === 'admin') {
      return;
    }

    // Check if user is owner or manager of the company
    const membership = companyUsers.find(
      (cu) => cu.companyId === companyId && cu.isActive,
    );

    if (!membership || (membership.role !== 'owner' && membership.role !== 'manager')) {
      throw new ForbiddenException('You do not have permission to manage this company');
    }
  }
}
