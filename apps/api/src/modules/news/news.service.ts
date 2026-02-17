import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async findAllByCompany(companyId: string) {
    return this.prisma.companyNews.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublishedByCompany(companyId: string) {
    return this.prisma.companyNews.findMany({
      where: {
        companyId,
        isActive: true,
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const news = await this.prisma.companyNews.findUnique({
      where: { id },
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    return news;
  }

  async create(
    companyId: string,
    data: { title: string; content: string; excerpt?: string; imageUrl?: string },
    userId: string,
  ) {
    return this.prisma.companyNews.create({
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        imageUrl: data.imageUrl,
        companyId,
        createdById: userId,
      },
    });
  }

  async update(
    id: string,
    data: { title?: string; content?: string; excerpt?: string; imageUrl?: string },
  ) {
    await this.findById(id);

    return this.prisma.companyNews.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.companyNews.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async publish(id: string) {
    await this.findById(id);

    return this.prisma.companyNews.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    await this.findById(id);

    return this.prisma.companyNews.update({
      where: { id },
      data: { publishedAt: null },
    });
  }
}
