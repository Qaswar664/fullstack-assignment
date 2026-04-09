import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes EXCEPT the root health check
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Swagger only available in development
  if (isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle('Multi-Tenant CRM API')
      .setDescription(
        'A Multi-Tenant CRM System built with NestJS, PostgreSQL and Prisma. Supports organizations, users, customers, notes and activity logs.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT-auth',
      )
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'JWT-refresh',
      )
      .addServer('http://localhost:5000', 'Development server')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: { persistAuthorization: true },
      customSiteTitle: 'CRM API Docs',
    });
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);
  if (isDevelopment) {
    logger.log(`Swagger docs available at http://localhost:${port}/api`);
  }
}

bootstrap().catch((error) => {
  Logger.error('Error starting server', error);
  process.exit(1);
});
