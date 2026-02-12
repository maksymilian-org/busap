import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { R2StorageService } from './r2-storage.service';
import { STORAGE_PROVIDER } from './storage.interface';

@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const useR2 = configService.get('R2_ACCESS_KEY_ID');
        if (useR2) {
          return new R2StorageService(configService);
        }
        return new StorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
