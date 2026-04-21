import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );
  
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

  await app.listen(3001);
  console.log('🚀 Backend server running on http://localhost:3001');
  console.log('📋 API Base URL: http://localhost:3001/api');
  console.log('📝 Available endpoints:');
  console.log('   - GET  /api/users');
  console.log('   - GET  /api/projects');
  console.log('   - GET  /api/suivi-projects');
  console.log('   - GET  /api/devis');
  console.log('   - GET  /api/marketplace/produits');
  console.log('   - GET  /api/marketplace/commandes');
  console.log('   - GET  /api/users/public/workers');
  console.log('   - GET  /api/projects/public/showcase');
  console.log('   - GET  /api/messages/conversations');
  console.log('   - GET  /api/matching/my-requests');
  console.log('   - GET  /api/matching/expert/catalog');
  console.log('   - GET  /api/proposals/by-project/:projectId');
  console.log('   - GET  /api/contracts/by-project/:projectId');
}
bootstrap();
