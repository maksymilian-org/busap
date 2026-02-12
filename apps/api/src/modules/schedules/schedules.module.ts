import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { CalendarsModule } from '../calendars/calendars.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [CalendarsModule, TripsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
