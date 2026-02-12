import { IsString, IsOptional, IsIn, IsDateString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExceptionDto {
  @ApiProperty({
    description: 'Exception date (YYYY-MM-DD)',
    example: '2026-12-24',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Exception type',
    enum: ['skip', 'modify'],
    example: 'skip',
  })
  @IsString()
  @IsIn(['skip', 'modify'])
  type: 'skip' | 'modify';

  @ApiPropertyOptional({
    description: 'New departure time for modify type (HH:MM format)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'newDepartureTime must be in HH:MM format',
  })
  newDepartureTime?: string;

  @ApiPropertyOptional({
    description: 'New arrival time for modify type (HH:MM format)',
    example: '13:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'newArrivalTime must be in HH:MM format',
  })
  newArrivalTime?: string;

  @ApiPropertyOptional({
    description: 'New vehicle ID for modify type',
  })
  @IsOptional()
  @IsString()
  newVehicleId?: string;

  @ApiPropertyOptional({
    description: 'New driver ID for modify type',
  })
  @IsOptional()
  @IsString()
  newDriverId?: string;

  @ApiPropertyOptional({
    description: 'Reason for the exception',
    example: 'Christmas Eve - no service',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
