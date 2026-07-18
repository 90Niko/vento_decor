import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

function isPrivateDevelopmentOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const isPrivateHost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      /^10\./.test(url.hostname) ||
      /^192\.168\./.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);

    return url.protocol === 'http:' && url.port === '3002' && isPrivateHost;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendOrigin = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3002',
  );
  const allowedOrigins = new Set([
    frontendOrigin,
    'http://localhost:3000',
    'http://localhost:3002',
  ]);

  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, callback: CorsOriginCallback) => {
      if (
        !origin ||
        allowedOrigins.has(origin) ||
        isPrivateDevelopmentOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS.'), false);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
