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
import { RoutesService } from './routes.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  CreateRouteInput,
  UpdateRouteInput,
  CreateRouteVersionInput,
  CreateRouteExceptionInput,
  RoutePreviewInput,
} from '@busap/shared';

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all routes' })
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('favorites') favorites?: string,
  ) {
    const favoritesOnly = favorites !== 'false';
    return this.routesService.findAll(companyId, favoritesOnly);
  }

  @Post('preview-geometry')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Preview route geometry from stops and waypoints' })
  async previewGeometry(@Body() data: RoutePreviewInput) {
    return this.routesService.previewGeometry(data);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search routes between two stops' })
  async search(
    @Query('fromStopId') fromStopId: string,
    @Query('toStopId') toStopId: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.routesService.searchRoutes(fromStopId, toStopId, companyId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get route by ID' })
  async findById(@Param('id') id: string) {
    return this.routesService.findById(id);
  }

  @Get(':id/exceptions')
  @Public()
  @ApiOperation({ summary: 'Get active exceptions for route' })
  async getExceptions(@Param('id') id: string) {
    return this.routesService.getActiveExceptions(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new route' })
  async create(@Body() data: CreateRouteInput, @CurrentUser() user: any) {
    return this.routesService.create(data, user?.dbUser?.id);
  }

  @Post('favorites')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add route to company favorites' })
  async addFavorite(
    @Body() body: { companyId: string; routeId: string },
    @CurrentUser() user: any,
  ) {
    return this.routesService.addFavorite(body.companyId, body.routeId, user.dbUser.id);
  }

  @Delete('favorites/:routeId')
  @ApiBearerAuth()
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Remove route from company favorites' })
  async removeFavorite(
    @Param('routeId') routeId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.routesService.removeFavorite(companyId, routeId);
  }

  @Post(':id/versions')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new route version' })
  async createVersion(
    @Param('id') id: string,
    @Body() data: Omit<CreateRouteVersionInput, 'routeId'>,
  ) {
    return this.routesService.createVersion({ ...data, routeId: id });
  }

  @Post(':id/exceptions')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a route exception' })
  async createException(
    @Param('id') id: string,
    @Body() data: Omit<CreateRouteExceptionInput, 'routeId'>,
  ) {
    return this.routesService.createException({ ...data, routeId: id });
  }

  @Post(':id/duplicate')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Duplicate a route' })
  async duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.routesService.duplicate(id, user?.dbUser?.id);
  }

  @Post(':id/reverse')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create reverse route' })
  async reverse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.routesService.reverse(id, user?.dbUser?.id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update route' })
  async update(@Param('id') id: string, @Body() data: UpdateRouteInput, @CurrentUser() user: any) {
    return this.routesService.update(id, data, user?.dbUser);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete route (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.routesService.delete(id);
  }
}
