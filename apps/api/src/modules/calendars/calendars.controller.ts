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
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto/create-calendar.dto';
import { CreateCalendarEntryDto, UpdateCalendarEntryDto } from './dto/create-entry.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@busap/shared';

@ApiTags('company-calendars')
@Controller('companies/:companyId/calendars')
@ApiBearerAuth()
export class CompanyCalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get system + company calendars' })
  async findForCompany(@Param('companyId') companyId: string) {
    return this.calendarsService.findForCompany(companyId);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a company calendar' })
  async create(
    @Param('companyId') companyId: string,
    @Body() data: CreateCalendarDto,
  ) {
    return this.calendarsService.create({ ...data, companyId } as any);
  }

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a company calendar' })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() data: UpdateCalendarDto,
  ) {
    return this.calendarsService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a company calendar' })
  async delete(@Param('id') id: string) {
    return this.calendarsService.delete(id);
  }

  @Post(':id/entries')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add entry to a company calendar' })
  async createEntry(@Param('id') id: string, @Body() data: CreateCalendarEntryDto) {
    return this.calendarsService.createEntry(id, data);
  }

  @Put(':id/entries/:entryId')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a company calendar entry' })
  async updateEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() data: UpdateCalendarEntryDto,
  ) {
    return this.calendarsService.updateEntry(id, entryId, data);
  }

  @Delete(':id/entries/:entryId')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a company calendar entry' })
  async deleteEntry(@Param('id') id: string, @Param('entryId') entryId: string) {
    return this.calendarsService.deleteEntry(id, entryId);
  }
}

@ApiTags('calendars')
@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all calendars' })
  async findAll(
    @Query('country') country?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.calendarsService.findAll({
      country,
      type,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('dates')
  @Public()
  @ApiOperation({ summary: 'Get calendar dates for a year' })
  async getCalendarDates(
    @Query('calendarId') calendarId: string,
    @Query('year') year: string,
  ) {
    return this.calendarsService.getCalendarDates(calendarId, parseInt(year, 10));
  }

  @Get('dates/by-code')
  @Public()
  @ApiOperation({ summary: 'Get calendar dates by code for a year' })
  async getCalendarDatesByCode(
    @Query('code') code: string,
    @Query('year') year: string,
  ) {
    return this.calendarsService.getCalendarDatesByCode(code, parseInt(year, 10));
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get calendar by ID with entries' })
  async findById(@Param('id') id: string) {
    return this.calendarsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new calendar (superadmin only)' })
  async create(@Body() data: CreateCalendarDto) {
    return this.calendarsService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a calendar (superadmin only)' })
  async update(@Param('id') id: string, @Body() data: UpdateCalendarDto) {
    return this.calendarsService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a calendar (superadmin only)' })
  async delete(@Param('id') id: string) {
    return this.calendarsService.delete(id);
  }

  // Calendar Entry endpoints

  @Post(':id/entries')
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add an entry to a calendar (superadmin only)' })
  async createEntry(@Param('id') id: string, @Body() data: CreateCalendarEntryDto) {
    return this.calendarsService.createEntry(id, data);
  }

  @Put(':id/entries/:entryId')
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a calendar entry (superadmin only)' })
  async updateEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() data: UpdateCalendarEntryDto,
  ) {
    return this.calendarsService.updateEntry(id, entryId, data);
  }

  @Delete(':id/entries/:entryId')
  @ApiBearerAuth()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a calendar entry (superadmin only)' })
  async deleteEntry(@Param('id') id: string, @Param('entryId') entryId: string) {
    return this.calendarsService.deleteEntry(id, entryId);
  }
}
