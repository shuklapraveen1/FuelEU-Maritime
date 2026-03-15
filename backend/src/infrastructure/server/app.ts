/**
 * App Factory
 *
 * Wires together all layers:
 *   Infrastructure (Prisma) → Repositories → Domain Services → Use Cases → Controllers → Express
 *
 * This is the composition root of the hexagonal architecture.
 */

import compression from 'compression';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { ComplianceCalculator } from '../../core/domain/ComplianceCalculator';
import { BankingService } from '../../core/domain/BankingService';
import { PoolingAlgorithm } from '../../core/domain/PoolingAlgorithm';

import { RouteUseCases } from '../../core/application/RouteUseCases';
import { ComplianceUseCases } from '../../core/application/ComplianceUseCases';

import { PrismaRouteRepository } from '../../adapters/outbound/postgres/PrismaRouteRepository';
import { PrismaComplianceRepository } from '../../adapters/outbound/postgres/PrismaComplianceRepository';

import { createRoutesRouter } from '../../adapters/inbound/http/routesController';
import {
  createBankingRouter,
  createComplianceRouter,
  createPoolingRouter,
} from '../../adapters/inbound/http/complianceController';

import { errorHandler } from '../../shared/errorHandler';
import { swaggerSpec } from './swagger';
import { prisma } from '../db/prismaClient';

export function createApp(): Express {
  const app = express();

  // ─── Middleware ────────────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(compression());
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ─── Composition Root ──────────────────────────────────────────────────────
  // Repositories (outbound adapters)
  const routeRepo = new PrismaRouteRepository(prisma);
  const complianceRepo = new PrismaComplianceRepository(prisma);

  // Domain services
  const calculator = new ComplianceCalculator();
  const bankingService = new BankingService();
  const poolingAlgorithm = new PoolingAlgorithm();

  // Use cases (application layer)
  const routeUseCases = new RouteUseCases(routeRepo, calculator);
  const complianceUseCases = new ComplianceUseCases(
    complianceRepo,
    bankingService,
    poolingAlgorithm
  );

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/routes', createRoutesRouter(routeUseCases));
  app.use('/api/compliance', createComplianceRouter(complianceUseCases));
  app.use('/api/banking', createBankingRouter(complianceUseCases));
  app.use('/api/pools', createPoolingRouter(complianceUseCases));

  // ─── Swagger Docs ──────────────────────────────────────────────────────────
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  );

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
