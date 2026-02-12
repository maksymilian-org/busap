import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'family-uuid:token-uuid' })
  @IsString()
  refreshToken: string;
}
