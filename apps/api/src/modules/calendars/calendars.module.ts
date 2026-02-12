import { Module } from '@nestjs/common';
import { CalendarsController, CompanyCalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';

@Module({
  controllers: [CalendarsController, CompanyCalendarsController],
  providers: [CalendarsService],
  exports: [CalendarsService],
})
export class CalendarsModule {}
