import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      configService.get('CORS_ORIGIN', '*'),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Busap API')
    .setDescription('Intercity Bus Transportation Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('companies', 'Company management')
    .addTag('stops', 'Bus stops')
    .addTag('routes', 'Bus routes')
    .addTag('trips', 'Scheduled trips')
    .addTag('vehicles', 'Vehicle management')
    .addTag('pricing', 'Pricing engine')
    .addTag('eta', 'ETA calculations')
    .addTag('gps', 'GPS tracking')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Start server
  const port = configService.get('API_PORT', 3001);
  const host = configService.get('API_HOST', '0.0.0.0');

  await app.listen(port, host);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/docs`);
}

bootstrap();
