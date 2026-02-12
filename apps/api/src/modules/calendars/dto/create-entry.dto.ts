import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class NthWeekdayDto {
  @ApiProperty({ description: 'Month (1-12)', example: 11 })
  @IsInt()
  month: number;

  @ApiProperty({ description: 'Weekday (0=Sunday, 1=Monday, ..., 6=Saturday)', example: 4 })
  @IsInt()
  weekday: number;

  @ApiProperty({ description: 'Nth occurrence (1-5, negative for from end)', example: 4 })
  @IsInt()
  nth: number;
}

export class CreateCalendarEntryDto {
  @ApiProperty({ description: 'Entry name', example: 'Christmas Day' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Date type',
    enum: ['fixed', 'easter_relative', 'nth_weekday'],
    example: 'fixed',
  })
  @IsString()
  @IsIn(['fixed', 'easter_relative', 'nth_weekday'])
  dateType: string;

  @ApiPropertyOptional({
    description: 'Fixed date in MM-DD or YYYY-MM-DD format',
    example: '12-25',
  })
  @IsOptional()
  @IsString()
  fixedDate?: string;

  @ApiPropertyOptional({
    description: 'Days offset from Easter Sunday',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  easterOffset?: number;

  @ApiPropertyOptional({
    description: 'Nth weekday configuration',
    type: NthWeekdayDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NthWeekdayDto)
  nthWeekday?: NthWeekdayDto;

  @ApiPropertyOptional({
    description: 'Start date for date ranges (YYYY-MM-DD)',
    example: '2026-02-16',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for date ranges (YYYY-MM-DD)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether this entry recurs yearly',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}

export class UpdateCalendarEntryDto {
  @ApiPropertyOptional({ description: 'Entry name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Date type',
    enum: ['fixed', 'easter_relative', 'nth_weekday'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['fixed', 'easter_relative', 'nth_weekday'])
  dateType?: string;

  @ApiPropertyOptional({ description: 'Fixed date in MM-DD or YYYY-MM-DD format' })
  @IsOptional()
  @IsString()
  fixedDate?: string;

  @ApiPropertyOptional({ description: 'Days offset from Easter Sunday' })
  @IsOptional()
  @IsInt()
  easterOffset?: number;

  @ApiPropertyOptional({ description: 'Nth weekday configuration' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NthWeekdayDto)
  nthWeekday?: NthWeekdayDto;

  @ApiPropertyOptional({ description: 'Start date for date ranges (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for date ranges (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Whether this entry recurs yearly' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
