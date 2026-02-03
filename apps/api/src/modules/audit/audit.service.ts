import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogInput, SearchAuditLogsInput } from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        oldValue: data.oldValue as Prisma.InputJsonValue,
        newValue: data.newValue as Prisma.InputJsonValue,
      },
    });
  }

  async search(params: SearchAuditLogsInput) {
    const {
      userId,
      companyId,
      action,
      entityType,
      entityId,
      fromDate,
      toDate,
      limit = 50,
      offset = 0,
    } = params;

    return this.prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(companyId && { companyId }),
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentActivity(companyId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
