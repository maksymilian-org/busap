import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserFavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Companies ====================

  async getFavoriteCompanies(userId: string) {
    return this.prisma.userFavoriteCompany.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteCompany(userId: string, companyId: string) {
    try {
      return await this.prisma.userFavoriteCompany.create({
        data: { userId, companyId },
        include: { company: true },
      });
    } catch (error: any) {
      // Unique constraint violation — already favorited
      if (error.code === 'P2002') {
        return this.prisma.userFavoriteCompany.findFirst({
          where: { userId, companyId },
          include: { company: true },
        });
      }
      throw error;
    }
  }

  async removeFavoriteCompany(userId: string, companyId: string) {
    await this.prisma.userFavoriteCompany.deleteMany({
      where: { userId, companyId },
    });
  }

  // ==================== Routes ====================

  async getFavoriteRoutes(userId: string) {
    return this.prisma.userFavoriteRoute.findMany({
      where: { userId },
      include: { route: { include: { company: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteRoute(userId: string, routeId: string) {
    try {
      return await this.prisma.userFavoriteRoute.create({
        data: { userId, routeId },
        include: { route: { include: { company: true } } },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return this.prisma.userFavoriteRoute.findFirst({
          where: { userId, routeId },
          include: { route: { include: { company: true } } },
        });
      }
      throw error;
    }
  }

  async removeFavoriteRoute(userId: string, routeId: string) {
    await this.prisma.userFavoriteRoute.deleteMany({
      where: { userId, routeId },
    });
  }

  // ==================== Stops ====================

  async getFavoriteStops(userId: string) {
    return this.prisma.userFavoriteStop.findMany({
      where: { userId },
      include: { stop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteStop(userId: string, stopId: string) {
    try {
      return await this.prisma.userFavoriteStop.create({
        data: { userId, stopId },
        include: { stop: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return this.prisma.userFavoriteStop.findFirst({
          where: { userId, stopId },
          include: { stop: true },
        });
      }
      throw error;
    }
  }

  async removeFavoriteStop(userId: string, stopId: string) {
    await this.prisma.userFavoriteStop.deleteMany({
      where: { userId, stopId },
    });
  }

  // ==================== Check ====================

  async checkFavorites(
    userId: string,
    companyIds?: string[],
    routeIds?: string[],
    stopIds?: string[],
  ): Promise<{ companies: string[]; routes: string[]; stops: string[] }> {
    const [companies, routes, stops] = await Promise.all([
      companyIds?.length
        ? this.prisma.userFavoriteCompany
            .findMany({
              where: { userId, companyId: { in: companyIds } },
              select: { companyId: true },
            })
            .then((results) => results.map((r) => r.companyId))
        : Promise.resolve([]),

      routeIds?.length
        ? this.prisma.userFavoriteRoute
            .findMany({
              where: { userId, routeId: { in: routeIds } },
              select: { routeId: true },
            })
            .then((results) => results.map((r) => r.routeId))
        : Promise.resolve([]),

      stopIds?.length
        ? this.prisma.userFavoriteStop
            .findMany({
              where: { userId, stopId: { in: stopIds } },
              select: { stopId: true },
            })
            .then((results) => results.map((r) => r.stopId))
        : Promise.resolve([]),
    ]);

    return { companies, routes, stops };
  }

  // ==================== Dashboard ====================

  async getDashboard(userId: string) {
    const favoriteCompanies = await this.getFavoriteCompanies(userId);

    const companyIds = favoriteCompanies.map((fc) => fc.companyId);

    const news = companyIds.length
      ? await this.prisma.companyNews.findMany({
          where: {
            companyId: { in: companyIds },
            isActive: true,
            publishedAt: { not: null, lte: new Date() },
          },
          include: { company: true },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        })
      : [];

    return {
      news,
      favoriteCompanies,
    };
  }
}
