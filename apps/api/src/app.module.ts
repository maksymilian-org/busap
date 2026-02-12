import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { StopsModule } from './modules/stops/stops.module';
import { RoutesModule } from './modules/routes/routes.module';
import { TripsModule } from './modules/trips/trips.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { EtaModule } from './modules/eta/eta.module';
import { GpsModule } from './modules/gps/gps.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { StorageModule } from './modules/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { SchedulesModule } from './modules/schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    RedisModule,
    MailerModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    StopsModule,
    RoutesModule,
    TripsModule,
    VehiclesModule,
    PricingModule,
    EtaModule,
    GpsModule,
    AuditModule,
    RealtimeModule,
    StorageModule,
    AdminModule,
    SimulatorModule,
    CalendarsModule,
    SchedulesModule,
  ],
})
export class AppModule {}
