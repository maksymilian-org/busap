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
import { VirtualTripService } from './virtual-trip.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CreateTripInput, UpdateTripInput, TripStatusType } from '@busap/shared';

@ApiTags('trips')
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly virtualTripService: VirtualTripService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all trips (virtual + materialized) with filters' })
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
    // If companyId and date range provided, use virtual trip service
    if (companyId && fromDate) {
      const from = new Date(fromDate);
      const to = toDate ? new Date(toDate) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      return this.virtualTripService.getTripsForDateRange(companyId, from, to, {
        routeId,
        driverId,
        status,
      });
    }

    // Fallback to legacy materialized-only query
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
  @ApiOperation({ summary: 'Search upcoming trips between two stops (virtual + materialized)' })
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

  @Get('driver/company')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get all company trips for driver with assignment markers' })
  async getDriverCompanyTrips(
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ) {
    return this.tripsService.getDriverCompanyTrips(
      user.dbUser.id,
      date ? new Date(date) : undefined,
    );
  }

  @Get('driver/next')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver next trip with time until departure' })
  async getDriverNextTrip(@CurrentUser() user: any) {
    return this.tripsService.getDriverNextTrip(user.dbUser.id);
  }

  @Get('driver/:driverId')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
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
  @ApiOperation({ summary: 'Get trip by ID (supports virtual IDs)' })
  async findById(@Param('id') id: string) {
    const parsed = VirtualTripService.parseTripId(id);
    if (parsed.type === 'virtual') {
      // Return virtual trip info without materializing
      const trips = await this.virtualTripService.getTripsForDateRange(
        '', // Will be filled from schedule
        new Date(parsed.date!),
        new Date(new Date(parsed.date!).getTime() + 24 * 60 * 60 * 1000),
      );
      const trip = trips.find((t) => t.id === id);
      if (trip) return trip;
    }
    return this.tripsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new trip' })
  async create(@Body() data: CreateTripInput) {
    return this.tripsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update trip (materializes if virtual)' })
  async update(@Param('id') id: string, @Body() data: UpdateTripInput) {
    // Materialize if virtual
    const parsed = VirtualTripService.parseTripId(id);
    let tripId = id;
    if (parsed.type === 'virtual') {
      const trip = await this.virtualTripService.materializeTrip(parsed.scheduleId!, parsed.date!);
      tripId = trip.id;
    }
    return this.tripsService.update(tripId, data);
  }

  @Post(':id/assign-driver')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Assign driver to trip (materializes if virtual)' })
  async assignDriver(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { driverId?: string },
  ) {
    const driverId = body.driverId || user.dbUser.id;

    // Materialize if virtual
    const parsed = VirtualTripService.parseTripId(id);
    let tripId = id;
    if (parsed.type === 'virtual') {
      const trip = await this.virtualTripService.materializeTrip(parsed.scheduleId!, parsed.date!);
      tripId = trip.id;
    }

    return this.tripsService.update(tripId, { driverId });
  }

  @Post(':id/start')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Start a trip (materializes if virtual)' })
  async startTrip(@Param('id') id: string) {
    // Materialize if virtual
    const parsed = VirtualTripService.parseTripId(id);
    let tripId = id;
    if (parsed.type === 'virtual') {
      const trip = await this.virtualTripService.materializeTrip(parsed.scheduleId!, parsed.date!);
      tripId = trip.id;
    }
    return this.tripsService.startTrip(tripId);
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
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Cancel a trip (materializes if virtual)' })
  async cancelTrip(@Param('id') id: string) {
    const parsed = VirtualTripService.parseTripId(id);
    let tripId = id;
    if (parsed.type === 'virtual') {
      const trip = await this.virtualTripService.materializeTrip(parsed.scheduleId!, parsed.date!);
      tripId = trip.id;
    }
    return this.tripsService.cancelTrip(tripId);
  }
}
