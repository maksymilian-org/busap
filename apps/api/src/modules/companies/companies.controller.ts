import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CreateCompanyInput, UpdateCompanyInput } from '@busap/shared';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

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
    return this.companiesService.create(data, user.dbUser.id);
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
}
