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
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/create-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@busap/shared';

@ApiTags('schedules')
@Controller('schedules')
@ApiBearerAuth()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all schedules' })
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('routeId') routeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.schedulesService.findAll({
      companyId,
      routeId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get schedule by ID' })
  async findById(@Param('id') id: string) {
    return this.schedulesService.findById(id);
  }

  @Get(':id/preview')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Preview generated dates for a schedule' })
  async previewSchedule(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.schedulesService.previewSchedule(id, days ? parseInt(days, 10) : 30);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new schedule' })
  async create(@Body() data: CreateScheduleDto) {
    return this.schedulesService.create(data);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a schedule' })
  async update(@Param('id') id: string, @Body() data: UpdateScheduleDto) {
    return this.schedulesService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a schedule' })
  async delete(@Param('id') id: string) {
    return this.schedulesService.delete(id);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Duplicate a schedule with stop times (without exceptions)' })
  async duplicate(@Param('id') id: string) {
    return this.schedulesService.duplicate(id);
  }

  @Post(':id/generate')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Generate trips from schedule', deprecated: true })
  async generateTrips(
    @Param('id') id: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.schedulesService.generateTrips(
      id,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  // Exception endpoints

  @Post(':id/exceptions')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add an exception to a schedule' })
  async createException(
    @Param('id') id: string,
    @Body() data: CreateExceptionDto,
  ) {
    return this.schedulesService.createException(id, data);
  }

  @Delete(':id/exceptions/:exceptionId')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete an exception from a schedule' })
  async deleteException(
    @Param('id') id: string,
    @Param('exceptionId') exceptionId: string,
  ) {
    return this.schedulesService.deleteException(id, exceptionId);
  }
}
