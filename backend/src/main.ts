import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

/** Limite corps JSON (photos base64 sur /api/suivi/photo) — évite 413 Payload Too Large */
const BODY_LIMIT = '35mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  // Static files (uploaded images): served at http://localhost:3001/uploads/<file>
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads',
    index: false,
  });

  // Enable CORS for frontend (vitrine) and admin (backend-react)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
  console.log('📋 API Base URL: http://localhost:3001/api');
  console.log('📝 Available endpoints:');
  console.log('   - GET  /api/users');
  console.log('   - GET  /api/auth/verify-email?token=');
  console.log('   - POST /api/users/expert (multipart, inscription expert + CV)');
  console.log('   - POST /api/users/livreur (multipart, inscription livreur + CIN)');
  console.log('   - GET  /api/projects');
  console.log('   - GET  /api/suivi-projects');
  console.log('   - GET  /api/devis');
  console.log('   - GET  /api/marketplace/produits');
  console.log('   - GET  /api/marketplace/commandes');
}
bootstrap();
