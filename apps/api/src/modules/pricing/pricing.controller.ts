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
import { PricingService } from './pricing.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreatePriceInput, UpdatePriceInput } from '@busap/shared';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get all prices for a company' })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('routeId') routeId?: string,
  ) {
    return this.pricingService.findAll(companyId, routeId);
  }

  @Get('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate price for a journey' })
  async calculate(
    @Query('routeId') routeId: string,
    @Query('fromStopId') fromStopId: string,
    @Query('toStopId') toStopId: string,
    @Query('passengers') passengers?: number,
  ) {
    return this.pricingService.calculatePrice({
      routeId,
      fromStopId,
      toStopId,
      passengers,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Get price by ID' })
  async findById(@Param('id') id: string) {
    return this.pricingService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new price' })
  async create(@Body() data: CreatePriceInput) {
    return this.pricingService.create(data);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update price' })
  async update(@Param('id') id: string, @Body() data: UpdatePriceInput) {
    return this.pricingService.update(id, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete price (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.pricingService.delete(id);
  }
}
