import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StopsService } from './stops.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreateStopInput, UpdateStopInput } from '@busap/shared';

@ApiTags('stops')
@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all stops' })
  async findAll(@Query('companyId') companyId?: string) {
    return this.stopsService.findAll(companyId);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search stops' })
  async search(
    @Query('query') query?: string,
    @Query('companyId') companyId?: string,
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.stopsService.search({
      query,
      companyId,
      latitude,
      longitude,
      radius,
      limit,
      offset,
    });
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Get nearby stops' })
  async getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.stopsService.getNearbyStops(latitude, longitude, radius);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get stop by ID' })
  async findById(@Param('id') id: string) {
    return this.stopsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new stop' })
  async create(@Body() data: CreateStopInput) {
    return this.stopsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update stop' })
  async update(@Param('id') id: string, @Body() data: UpdateStopInput) {
    return this.stopsService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete stop (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.stopsService.delete(id);
  }
}
