import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrsService } from './ors.service';

@Module({
  imports: [HttpModule],
  providers: [OrsService],
  exports: [OrsService],
})
export class OrsModule {}
