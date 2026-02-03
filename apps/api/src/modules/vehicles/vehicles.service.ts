import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleInput, UpdateVehicleInput } from '@busap/shared';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        ...(companyId && { companyId }),
      },
      include: {
        company: true,
      },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        company: true,
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async create(data: CreateVehicleInput) {
    return this.prisma.vehicle.create({
      data,
      include: { company: true },
    });
  }

  async update(id: string, data: UpdateVehicleInput) {
    await this.findById(id);

    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { company: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAvailableVehicles(companyId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get vehicles that don't have trips on this date
    const busyVehicleIds = await this.prisma.trip.findMany({
      where: {
        companyId,
        status: { in: ['scheduled', 'in_progress'] },
        scheduledDepartureTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: { vehicleId: true },
    });

    const busyIds = busyVehicleIds.map((t: { vehicleId: string }) => t.vehicleId);

    return this.prisma.vehicle.findMany({
      where: {
        companyId,
        isActive: true,
        status: 'active',
        id: { notIn: busyIds },
      },
    });
  }

  async getVehicleWithLastPosition(id: string) {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        company: true,
        positions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }
}
