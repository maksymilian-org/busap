import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SimulatorService } from './simulator.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@busap/shared';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StartSimulationDto {
  @ApiProperty()
  @IsString()
  tripId: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  speedMultiplier?: number;

  @ApiPropertyOptional({ default: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(30000)
  updateIntervalMs?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  randomDeviation?: number;
}

@ApiTags('simulator')
@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Get('trips')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available trips for simulation' })
  async getAvailableTrips() {
    return this.simulatorService.getAvailableTrips();
  }

  @Get('simulations')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active simulations' })
  async listSimulations() {
    return this.simulatorService.listSimulations();
  }

  @Get('simulations/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get simulation state' })
  async getSimulation(@Param('id') id: string) {
    return this.simulatorService.getSimulation(id);
  }

  @Post('start')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a vehicle simulation' })
  async startSimulation(@Body() dto: StartSimulationDto) {
    return this.simulatorService.startSimulation({
      tripId: dto.tripId,
      speedMultiplier: dto.speedMultiplier || 10,
      updateIntervalMs: dto.updateIntervalMs || 2000,
      randomDeviation: dto.randomDeviation || 50,
    });
  }

  @Post('pause/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause a simulation' })
  async pauseSimulation(@Param('id') id: string) {
    return this.simulatorService.pauseSimulation(id);
  }

  @Post('resume/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a simulation' })
  async resumeSimulation(@Param('id') id: string) {
    return this.simulatorService.resumeSimulation(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop a simulation' })
  async stopSimulation(@Param('id') id: string) {
    return this.simulatorService.stopSimulation(id);
  }
}
