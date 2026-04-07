import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'BMP.tn API is running!',
      version: '1.0.0',
      baseUrl: '/api',
      endpoints: {
        users: {
          getAll: 'GET /api/users',
          getOne: 'GET /api/users/:id',
          register: 'POST /api/users (inscription + e-mail de vérification)',
          update: 'PUT /api/users/:id',
          delete: 'DELETE /api/users/:id',
        },
        auth: {
          verifyEmail: 'GET /api/auth/verify-email?token=',
        },
        projects: {
          getAll: 'GET /api/projects',
          getOne: 'GET /api/projects/:id',
          create: 'POST /api/projects',
          update: 'PUT /api/projects/:id',
          delete: 'DELETE /api/projects/:id',
        },
        suiviProjects: {
          getAll: 'GET /api/suivi-projects',
          getByProject: 'GET /api/suivi-projects?projectId=:id',
          create: 'POST /api/suivi-projects',
        },
        devis: {
          getAll: 'GET /api/devis',
          getOne: 'GET /api/devis/:id',
          create: 'POST /api/devis',
          addItem: 'POST /api/devis/:id/items',
        },
        marketplace: {
          produits: {
            getAll: 'GET /api/marketplace/produits',
            getOne: 'GET /api/marketplace/produits/:id',
            create: 'POST /api/marketplace/produits',
          },
          commandes: {
            getAll: 'GET /api/marketplace/commandes',
            getOne: 'GET /api/marketplace/commandes/:id',
            create: 'POST /api/marketplace/commandes',
          },
        },
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
