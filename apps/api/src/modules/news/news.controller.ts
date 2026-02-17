import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@busap/shared';

@ApiTags('news')
@ApiBearerAuth()
@Controller('companies/:companyId/news')
export class CompanyNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'List all news for a company (including drafts)' })
  async findAll(@Param('companyId') companyId: string) {
    return this.newsService.findAllByCompany(companyId);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Create news for a company' })
  async create(
    @Param('companyId') companyId: string,
    @Body() data: { title: string; content: string; excerpt?: string; imageUrl?: string },
    @CurrentUser() user: any,
  ) {
    return this.newsService.create(companyId, data, user.dbUser.id);
  }
}

@ApiTags('news')
@ApiBearerAuth()
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Put(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Update news' })
  async update(
    @Param('id') id: string,
    @Body() data: { title?: string; content?: string; excerpt?: string; imageUrl?: string },
  ) {
    return this.newsService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete news (soft delete)' })
  async delete(@Param('id') id: string) {
    return this.newsService.delete(id);
  }

  @Post(':id/publish')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Publish news' })
  async publish(@Param('id') id: string) {
    return this.newsService.publish(id);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Unpublish news' })
  async unpublish(@Param('id') id: string) {
    return this.newsService.unpublish(id);
  }
}
