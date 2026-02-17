import { Module } from '@nestjs/common';
import { CompanyNewsController } from './news.controller';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  controllers: [CompanyNewsController, NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
