import { Module } from '@nestjs/common';
import { StopsController } from './stops.controller';
import { StopsService } from './stops.service';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [GeocodingModule],
  controllers: [StopsController],
  providers: [StopsService],
  exports: [StopsService],
})
export class StopsModule {}
