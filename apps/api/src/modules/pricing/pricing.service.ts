import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePriceInput,
  UpdatePriceInput,
  CalculatePriceInput,
  PriceCalculationResult,
  PriceType,
} from '@busap/shared';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, routeId?: string) {
    return this.prisma.price.findMany({
      where: {
        companyId,
        isActive: true,
        ...(routeId && { routeId }),
      },
      include: {
        segments: true,
        route: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const price = await this.prisma.price.findUnique({
      where: { id },
      include: {
        segments: true,
        route: true,
      },
    });

    if (!price) {
      throw new NotFoundException(`Price with ID ${id} not found`);
    }

    return price;
  }

  async create(data: CreatePriceInput) {
    const { segments, ...priceData } = data;

    return this.prisma.price.create({
      data: {
        ...priceData,
        currency: priceData.currency ?? 'PLN',
        ...(segments && {
          segments: {
            create: segments,
          },
        }),
      },
      include: {
        segments: true,
        route: true,
      },
    });
  }

  async update(id: string, data: UpdatePriceInput) {
    await this.findById(id);

    return this.prisma.price.update({
      where: { id },
      data,
      include: {
        segments: true,
        route: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.price.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async calculatePrice(input: CalculatePriceInput): Promise<PriceCalculationResult> {
    const { routeId, fromStopId, toStopId, passengers = 1 } = input;

    // Get route with stops
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        company: true,
        currentVersion: {
          include: {
            stops: {
              include: { stop: true },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!route || !route.currentVersion) {
      throw new NotFoundException('Route not found');
    }

    // Get active price for route or company default
    const price = await this.prisma.price.findFirst({
      where: {
        companyId: route.companyId,
        isActive: true,
        validFrom: { lte: new Date() },
        AND: [
          { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] },
          { OR: [{ routeId }, { routeId: null }] },
        ],
      },
      include: { segments: true },
      orderBy: { routeId: 'desc' }, // Prefer route-specific price
    });

    if (!price) {
      throw new NotFoundException('No active price found for this route');
    }

    let unitPrice: number;
    const resultSegments: { fromStopId: string; toStopId: string; price: number }[] = [];

    if (price.type === PriceType.FLAT) {
      unitPrice = price.basePrice;
    } else {
      // Per segment pricing
      const stops = route.currentVersion.stops;
      const fromIndex = stops.findIndex((s: { stopId: string }) => s.stopId === fromStopId);
      const toIndex = stops.findIndex((s: { stopId: string }) => s.stopId === toStopId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
        throw new NotFoundException('Invalid stop combination');
      }

      // Calculate total price from segments
      unitPrice = 0;
      for (let i = fromIndex; i < toIndex; i++) {
        const currentStop = stops[i]!;
        const nextStop = stops[i + 1]!;

        // Find segment price
        const segmentPrice = price.segments?.find(
          (s: { fromStopId: string; toStopId: string; price: number }) =>
            s.fromStopId === currentStop.stopId &&
            s.toStopId === nextStop.stopId,
        );

        const segmentAmount = segmentPrice?.price ?? price.basePrice;
        unitPrice += segmentAmount;

        resultSegments.push({
          fromStopId: currentStop.stopId,
          toStopId: nextStop.stopId,
          price: segmentAmount,
        });
      }
    }

    return {
      unitPrice,
      totalPrice: unitPrice * passengers,
      currency: price.currency,
      priceType: price.type as any,
      ...(resultSegments.length > 0 && { segments: resultSegments }),
    };
  }
}
