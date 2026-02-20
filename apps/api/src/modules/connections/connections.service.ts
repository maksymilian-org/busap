import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConnectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.savedConnection.findMany({
      where: { userId },
      include: {
        fromStop: { select: { id: true, name: true, city: true } },
        toStop: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    userId: string,
    data: { fromStopId: string; toStopId: string; name?: string },
  ) {
    try {
      return await this.prisma.savedConnection.create({
        data: {
          userId,
          fromStopId: data.fromStopId,
          toStopId: data.toStopId,
          name: data.name,
        },
        include: {
          fromStop: { select: { id: true, name: true, city: true } },
          toStop: { select: { id: true, name: true, city: true } },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Connection already saved');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    const connection = await this.prisma.savedConnection.findFirst({
      where: { id, userId },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    return this.prisma.savedConnection.delete({ where: { id } });
  }
}
