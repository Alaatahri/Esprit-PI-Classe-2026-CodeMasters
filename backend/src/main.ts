import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend (vitrine) and admin (backend-react)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📋 API Base URL: http://localhost:${port}/api`);
  console.log('📝 Available endpoints:');
  console.log('   - GET  /api/users');
  console.log('   - GET  /api/workers (profils terrain)');
  console.log('   - GET  /api/projects');
  console.log('   - GET  /api/suivi-projects');
  console.log('   - GET  /api/devis');
  console.log('   - GET  /api/marketplace/produits');
  console.log('   - GET  /api/marketplace/commandes');
}
bootstrap();
