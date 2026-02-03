import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ReportPositionInput } from '@busap/shared';

@ApiTags('gps')
@Controller('gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post('report')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Report vehicle position' })
  async reportPosition(@Body() data: ReportPositionInput) {
    return this.gpsService.reportPosition(data);
  }

  @Get('vehicle/:vehicleId')
  @Public()
  @ApiOperation({ summary: 'Get latest position for a vehicle' })
  async getLatestPosition(@Param('vehicleId') vehicleId: string) {
    return this.gpsService.getLatestPosition(vehicleId);
  }

  @Get('trip/:tripId')
  @Public()
  @ApiOperation({ summary: 'Get live position for a trip' })
  async getLivePosition(@Param('tripId') tripId: string) {
    return this.gpsService.getLivePosition(tripId);
  }

  @Get('route/:routeId/live')
  @Public()
  @ApiOperation({ summary: 'Get all live positions for a route' })
  async getLivePositionsForRoute(@Param('routeId') routeId: string) {
    return this.gpsService.getLivePositionsForRoute(routeId);
  }

  @Get('vehicle/:vehicleId/history')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get position history for a vehicle' })
  async getPositionHistory(
    @Param('vehicleId') vehicleId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.gpsService.getPositionHistory(
      vehicleId,
      new Date(fromDate),
      new Date(toDate),
    );
  }
}
