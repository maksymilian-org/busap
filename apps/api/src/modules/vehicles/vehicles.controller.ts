import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreateVehicleInput, UpdateVehicleInput } from '@busap/shared';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all vehicles' })
  async findAll(@Query('companyId') companyId?: string) {
    return this.vehiclesService.findAll(companyId);
  }

  @Get('available')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get available vehicles for a date' })
  async getAvailable(
    @Query('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.vehiclesService.getAvailableVehicles(companyId, new Date(date));
  }

  @Get(':id')
  @Roles(UserRole.DRIVER, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get vehicle by ID' })
  async findById(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Get(':id/position')
  @Roles(UserRole.DRIVER, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get vehicle with last position' })
  async getWithPosition(@Param('id') id: string) {
    return this.vehiclesService.getVehicleWithLastPosition(id);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new vehicle' })
  async create(@Body() data: CreateVehicleInput) {
    return this.vehiclesService.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update vehicle' })
  async update(@Param('id') id: string, @Body() data: UpdateVehicleInput) {
    return this.vehiclesService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete vehicle (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.vehiclesService.delete(id);
  }
}
