// Zona horaria para fechas en BD (UTC-5 Colombia). Debe ir antes de otros imports.
process.env.TZ = process.env.TZ || 'America/Bogota';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/** Equivale localhost ↔ 127.0.0.1 (el navegador los trata como orígenes distintos). */
function expandCorsOrigins(origins: string[]): Set<string> {
  const set = new Set<string>();
  for (const o of origins) {
    set.add(o);
    set.add(o.replace(/:\/\/localhost(?=:|\/|$)/, '://127.0.0.1'));
    set.add(o.replace(/:\/\/127\.0\.0\.1(?=:|\/|$)/, '://localhost'));
  }
  return set;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  let raw = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  if (!raw?.trim()) {
    raw = 'http://localhost:5173';
  }
  const allowed = expandCorsOrigins(
    raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        return callback(null, true);
      }
      if (allowed.has(requestOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
