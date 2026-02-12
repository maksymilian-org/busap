import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum } from 'class-validator';

export class AssignCompanyRoleDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty({ enum: ['passenger', 'driver', 'manager', 'owner'] })
  @IsEnum(['passenger', 'driver', 'manager', 'owner'])
  role: string;
}
