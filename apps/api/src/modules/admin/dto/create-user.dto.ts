import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';

export class AdminCreateUserDto {
  @ApiProperty({ example: 'jan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Jan' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Kowalski' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['passenger', 'admin'] })
  @IsOptional()
  @IsEnum(['passenger', 'admin'])
  systemRole?: string;

  @ApiPropertyOptional({ enum: ['pl', 'en', 'ua', 'de', 'it', 'fr', 'es', 'be'] })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;
}
