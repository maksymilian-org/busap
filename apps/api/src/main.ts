import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);

  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: Number(configService.get('MAX_FILE_SIZE', 5242880)), // 5MB default
    },
  });

  // Register static file serving for uploads
  const uploadDir = configService.get('UPLOAD_DIR', './uploads');
  await app.register(fastifyStatic, {
    root: join(process.cwd(), uploadDir),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // CORS - allow all origins in development, or specific origins in production
  const isDev = configService.get('NODE_ENV', 'development') === 'development';
  app.enableCors({
    origin: isDev
      ? true // Allow all origins in development (for LAN testing)
      : [
          'http://localhost:3000',
          'http://localhost:8081',
          configService.get('CORS_ORIGIN', ''),
        ].filter(Boolean),
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
    .addTag('storage', 'File storage')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Start server - listen on '::' to handle both IPv4 and IPv6
  const port = configService.get('API_PORT', 3001);
  const host = configService.get('API_HOST', '::');

  await app.listen(port, host);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger docs available at: ${await app.getUrl()}/docs`);
}

bootstrap();
