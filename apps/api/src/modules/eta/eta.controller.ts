import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EtaService } from './eta.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('eta')
@Controller('eta')
export class EtaController {
  constructor(private readonly etaService: EtaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get ETA for a specific stop on a trip' })
  async getETA(
    @Query('tripId') tripId: string,
    @Query('stopId') stopId: string,
  ) {
    return this.etaService.getETA(tripId, stopId);
  }

  @Get('batch')
  @Public()
  @ApiOperation({ summary: 'Get ETA for multiple stops on a trip' })
  async getBatchETA(
    @Query('tripId') tripId: string,
    @Query('stopIds') stopIds: string,
  ) {
    const stopIdArray = stopIds.split(',');
    return this.etaService.getBatchETA(tripId, stopIdArray);
  }
}
