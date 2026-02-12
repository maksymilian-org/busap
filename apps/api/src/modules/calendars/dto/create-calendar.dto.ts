import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalendarDto {
  @ApiProperty({ description: 'Unique calendar code', example: 'pl-holidays' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Calendar name', example: 'Polish Public Holidays' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Calendar description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'PL' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Region/province code', example: 'mazowieckie' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({
    description: 'Calendar type',
    enum: ['holidays', 'school_days', 'custom'],
    example: 'holidays',
  })
  @IsString()
  @IsIn(['holidays', 'school_days', 'custom'])
  type: string;

  @ApiPropertyOptional({ description: 'Specific year (null for recurring yearly)' })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Whether calendar is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCalendarDto {
  @ApiPropertyOptional({ description: 'Calendar name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Calendar description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether calendar is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
