import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ScheduleStopTimeDto {
  @ApiProperty({ description: 'Route stop ID' })
  @IsString()
  routeStopId: string;

  @ApiPropertyOptional({
    description: 'Arrival time in HH:MM format (required for first and last stop)',
    example: '08:15',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'arrivalTime must be in HH:MM format',
  })
  arrivalTime?: string;

  @ApiPropertyOptional({
    description: 'Departure time in HH:MM format (required for first and last stop)',
    example: '08:17',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'departureTime must be in HH:MM format',
  })
  departureTime?: string;
}

export class CalendarModifierDto {
  @ApiProperty({
    description: 'Modifier type',
    enum: ['exclude', 'include_only', 'exclude_dates'],
  })
  @IsString()
  @IsIn(['exclude', 'include_only', 'exclude_dates'])
  type: 'exclude' | 'include_only' | 'exclude_dates';

  @ApiPropertyOptional({ description: 'Calendar ID for exclude/include_only' })
  @IsOptional()
  @IsString()
  calendarId?: string;

  @ApiPropertyOptional({
    description: 'Specific dates to exclude (YYYY-MM-DD format)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dates?: string[];
}

export class CreateScheduleDto {
  @ApiProperty({ description: 'Company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Route ID' })
  @IsString()
  routeId: string;

  @ApiPropertyOptional({ description: 'Default vehicle ID' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Default driver ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ description: 'Schedule name', example: 'Daily Warszawa-Krakow' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Schedule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Departure time in HH:MM format',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'departureTime must be in HH:MM format',
  })
  departureTime: string;

  @ApiProperty({
    description: 'Arrival time in HH:MM format',
    example: '12:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'arrivalTime must be in HH:MM format',
  })
  arrivalTime: string;

  @ApiProperty({
    description: 'Schedule type',
    enum: ['single', 'recurring'],
    example: 'recurring',
  })
  @IsString()
  @IsIn(['single', 'recurring'])
  scheduleType: 'single' | 'recurring';

  @ApiPropertyOptional({
    description: 'RRULE string (RFC 5545) for recurring schedules',
    example: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  })
  @IsOptional()
  @IsString()
  rrule?: string;

  @ApiProperty({ description: 'Valid from date' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Valid to date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({
    description: 'Calendar modifiers',
    type: [CalendarModifierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarModifierDto)
  calendarModifiers?: CalendarModifierDto[];

  @ApiPropertyOptional({
    description: 'Stop times for each route stop. First and last stop times are required.',
    type: [ScheduleStopTimeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleStopTimeDto)
  stopTimes?: ScheduleStopTimeDto[];

  @ApiPropertyOptional({ description: 'Whether schedule is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Default vehicle ID' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Default driver ID' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Schedule name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Schedule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Departure time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'departureTime must be in HH:MM format',
  })
  departureTime?: string;

  @ApiPropertyOptional({ description: 'Arrival time in HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'arrivalTime must be in HH:MM format',
  })
  arrivalTime?: string;

  @ApiPropertyOptional({ description: 'RRULE string (RFC 5545) for recurring schedules' })
  @IsOptional()
  @IsString()
  rrule?: string;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid to date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({
    description: 'Calendar modifiers',
    type: [CalendarModifierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalendarModifierDto)
  calendarModifiers?: CalendarModifierDto[];

  @ApiPropertyOptional({
    description: 'Stop times for each route stop. First and last stop times are required.',
    type: [ScheduleStopTimeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleStopTimeDto)
  stopTimes?: ScheduleStopTimeDto[];

  @ApiPropertyOptional({ description: 'Whether schedule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
