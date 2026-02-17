import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFavoritesService } from './user-favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class UserFavoritesController {
  constructor(private readonly userFavoritesService: UserFavoritesService) {}

  private getUserId(user: any): string {
    return user.dbUser?.id || user.id;
  }

  // ==================== Companies ====================

  @Get('companies')
  async getFavoriteCompanies(@CurrentUser() user: any) {
    return this.userFavoritesService.getFavoriteCompanies(this.getUserId(user));
  }

  @Post('companies/:companyId')
  async addFavoriteCompany(
    @CurrentUser() user: any,
    @Param('companyId') companyId: string,
  ) {
    return this.userFavoritesService.addFavoriteCompany(
      this.getUserId(user),
      companyId,
    );
  }

  @Delete('companies/:companyId')
  async removeFavoriteCompany(
    @CurrentUser() user: any,
    @Param('companyId') companyId: string,
  ) {
    await this.userFavoritesService.removeFavoriteCompany(
      this.getUserId(user),
      companyId,
    );
  }

  // ==================== Routes ====================

  @Get('routes')
  async getFavoriteRoutes(@CurrentUser() user: any) {
    return this.userFavoritesService.getFavoriteRoutes(this.getUserId(user));
  }

  @Post('routes/:routeId')
  async addFavoriteRoute(
    @CurrentUser() user: any,
    @Param('routeId') routeId: string,
  ) {
    return this.userFavoritesService.addFavoriteRoute(
      this.getUserId(user),
      routeId,
    );
  }

  @Delete('routes/:routeId')
  async removeFavoriteRoute(
    @CurrentUser() user: any,
    @Param('routeId') routeId: string,
  ) {
    await this.userFavoritesService.removeFavoriteRoute(
      this.getUserId(user),
      routeId,
    );
  }

  // ==================== Stops ====================

  @Get('stops')
  async getFavoriteStops(@CurrentUser() user: any) {
    return this.userFavoritesService.getFavoriteStops(this.getUserId(user));
  }

  @Post('stops/:stopId')
  async addFavoriteStop(
    @CurrentUser() user: any,
    @Param('stopId') stopId: string,
  ) {
    return this.userFavoritesService.addFavoriteStop(
      this.getUserId(user),
      stopId,
    );
  }

  @Delete('stops/:stopId')
  async removeFavoriteStop(
    @CurrentUser() user: any,
    @Param('stopId') stopId: string,
  ) {
    await this.userFavoritesService.removeFavoriteStop(
      this.getUserId(user),
      stopId,
    );
  }

  // ==================== Check ====================

  @Get('check')
  async checkFavorites(
    @CurrentUser() user: any,
    @Query('companyIds') companyIds?: string,
    @Query('routeIds') routeIds?: string,
    @Query('stopIds') stopIds?: string,
  ) {
    return this.userFavoritesService.checkFavorites(
      this.getUserId(user),
      companyIds ? companyIds.split(',').filter(Boolean) : undefined,
      routeIds ? routeIds.split(',').filter(Boolean) : undefined,
      stopIds ? stopIds.split(',').filter(Boolean) : undefined,
    );
  }

  // ==================== Dashboard ====================

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: any) {
    return this.userFavoritesService.getDashboard(this.getUserId(user));
  }
}
