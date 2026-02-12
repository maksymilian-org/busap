import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: ['passenger', 'driver', 'manager', 'owner', 'admin'] })
  @IsOptional()
  @IsEnum(['passenger', 'driver', 'manager', 'owner', 'admin'])
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ enum: ['passenger', 'driver', 'manager', 'owner'] })
  @IsOptional()
  @IsEnum(['passenger', 'driver', 'manager', 'owner'])
  companyRole?: string;
}
