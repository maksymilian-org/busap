import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CreateTripInput, UpdateTripInput, TripStatusType } from '@busap/shared';

@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all trips with filters' })
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('routeId') routeId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('status') status?: TripStatusType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.tripsService.findAll({
      companyId,
      routeId,
      vehicleId,
      driverId,
      status,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit,
      offset,
    });
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search upcoming trips between two stops' })
  async searchTrips(
    @Query('fromStopId') fromStopId: string,
    @Query('toStopId') toStopId: string,
    @Query('date') date?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.tripsService.searchUpcomingTrips(
      fromStopId,
      toStopId,
      date ? new Date(date) : undefined,
      companyId,
    );
  }

  @Get('driver/today')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current driver trips for today' })
  async getDriverTripsToday(@CurrentUser() user: any) {
    return this.tripsService.getDriverTrips(user.dbUser.id);
  }

  @Get('driver/:driverId')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get trips for a specific driver' })
  async getDriverTrips(
    @Param('driverId') driverId: string,
    @Query('date') date?: string,
  ) {
    return this.tripsService.getDriverTrips(
      driverId,
      date ? new Date(date) : undefined,
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get trip by ID' })
  async findById(@Param('id') id: string) {
    return this.tripsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new trip' })
  async create(@Body() data: CreateTripInput) {
    return this.tripsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update trip' })
  async update(@Param('id') id: string, @Body() data: UpdateTripInput) {
    return this.tripsService.update(id, data);
  }

  @Post(':id/start')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Start a trip' })
  async startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

  @Post(':id/complete')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Complete a trip' })
  async completeTrip(@Param('id') id: string) {
    return this.tripsService.completeTrip(id);
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Cancel a trip' })
  async cancelTrip(@Param('id') id: string) {
    return this.tripsService.cancelTrip(id);
  }
}
