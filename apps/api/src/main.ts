import 'reflect-metadata';
// Load .env from monorepo root before any module imports that validate env
import * as path from 'path';
import * as dotenv from 'dotenv';
// dist/ -> apps/api/ -> apps/ -> NOEVRA/ (root)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getEnv } from '@growthos/config';
import * as pino from 'pino';
import { pinoHttp } from 'pino-http';

async function bootstrap(): Promise<void> {
  const env = getEnv();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: false, // We use pino
  });

  // HTTP request logging
  const pinoOptions =
    env.NODE_ENV === 'development'
      ? {
          level: env.LOG_LEVEL,
          transport: { target: 'pino-pretty', options: { colorize: true } } as const,
        }
      : { level: env.LOG_LEVEL };

  app.use(
    pinoHttp({
      logger: pino.default(pinoOptions),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.passwordConfirmation',
          'req.body.currentPassword',
        ],
        remove: true,
      },
    }),
  );

  // Security headers
  const helmet = (await import('helmet')).default;
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: env.APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe — strip unknown fields, transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global API prefix + URI versioning → /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Swagger / OpenAPI
  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GrowthOS API')
      .setDescription('GrowthOS — Autonomous AI Growth Operating System API')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    // Note: SwaggerModule.setup bypasses global prefix, so we specify full path
    SwaggerModule.setup('api/docs', app, document, { useGlobalPrefix: false });
  }

  const port = env.API_PORT;
  await app.listen(port);

  console.log(`GrowthOS API running on: ${env.API_URL}`);
  if (env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: ${env.API_URL}/api/docs`);
  }
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
