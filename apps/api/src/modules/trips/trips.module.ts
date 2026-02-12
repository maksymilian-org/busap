import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { VirtualTripService } from './virtual-trip.service';
import { CalendarsModule } from '../calendars/calendars.module';

@Module({
  imports: [CalendarsModule],
  controllers: [TripsController],
  providers: [TripsService, VirtualTripService],
  exports: [TripsService, VirtualTripService],
})
export class TripsModule {}
