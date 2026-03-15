/**
 * Swagger / OpenAPI configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FuelEU Maritime Compliance API',
      version: '1.0.0',
      description:
        'REST API for the FuelEU Maritime Compliance Platform. Implements Articles 4, 20, and 21 of the FuelEU Maritime Regulation.',
      contact: {
        name: 'FuelEU Platform',
        email: 'support@fueleu.example.com',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    tags: [
      { name: 'Routes', description: 'Maritime route management' },
      { name: 'Compliance', description: 'Compliance balance calculations' },
      { name: 'Banking', description: 'Article 20 — Banking surplus CB' },
      { name: 'Pooling', description: 'Article 21 — Compliance pools' },
    ],
  },
  apis: ['./src/adapters/inbound/http/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
