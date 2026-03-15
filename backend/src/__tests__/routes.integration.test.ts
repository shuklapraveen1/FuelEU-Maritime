/**
 * Integration Tests — Routes API
 *
 * Uses Supertest to hit the real Express app with a test database.
 * Each test suite clears relevant tables before running.
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../infrastructure/server/app';
import { Express } from 'express';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL ?? 'postgresql://fueleu:fueleu@localhost:5432/fueleu_db' },
  },
});

let app: Express;

beforeAll(async () => {
  app = createApp();
  // Seed minimal test data
  await prisma.route.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();

  await prisma.route.createMany({
    data: [
      {
        id: 'test-r001',
        routeId: 'R001',
        vesselType: 'Container',
        fuelType: 'HFO',
        year: 2024,
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
        distance: 12000,
        totalEmissions: 4500,
        isBaseline: false,
        updatedAt: new Date(),
      },
      {
        id: 'test-r002',
        routeId: 'R002',
        vesselType: 'BulkCarrier',
        fuelType: 'LNG',
        year: 2024,
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
        distance: 11500,
        totalEmissions: 4200,
        isBaseline: false,
        updatedAt: new Date(),
      },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── GET /routes ──────────────────────────────────────────────────────────────

describe('GET /api/routes', () => {
  it('returns 200 with all routes', async () => {
    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by vesselType', async () => {
    const res = await request(app).get('/api/routes?vesselType=Container');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { vesselType: string }) => r.vesselType === 'Container')).toBe(true);
  });

  it('filters by fuelType', async () => {
    const res = await request(app).get('/api/routes?fuelType=LNG');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { fuelType: string }) => r.fuelType === 'LNG')).toBe(true);
  });

  it('filters by year', async () => {
    const res = await request(app).get('/api/routes?year=2024');
    expect(res.status).toBe(200);
    expect(res.body.data.every((r: { year: number }) => r.year === 2024)).toBe(true);
  });

  it('rejects invalid year filter', async () => {
    const res = await request(app).get('/api/routes?year=not-a-number');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ─── POST /routes/:routeId/baseline ──────────────────────────────────────────

describe('POST /api/routes/:routeId/baseline', () => {
  it('sets a route as baseline and returns updated route', async () => {
    const res = await request(app).post('/api/routes/R001/baseline');
    expect(res.status).toBe(200);
    expect(res.body.data.routeId).toBe('R001');
    expect(res.body.data.isBaseline).toBe(true);
  });

  it('clears previous baseline when new one is set', async () => {
    await request(app).post('/api/routes/R001/baseline');
    await request(app).post('/api/routes/R002/baseline');

    const routesRes = await request(app).get('/api/routes');
    const baselines = routesRes.body.data.filter((r: { isBaseline: boolean }) => r.isBaseline);
    expect(baselines.length).toBe(1);
    expect(baselines[0].routeId).toBe('R002');
  });

  it('returns 404 for non-existent route', async () => {
    const res = await request(app).post('/api/routes/DOES-NOT-EXIST/baseline');
    expect(res.status).toBe(404);
  });
});

// ─── GET /routes/comparison ───────────────────────────────────────────────────

describe('GET /api/routes/comparison', () => {
  beforeEach(async () => {
    // Ensure R001 is set as baseline
    await request(app).post('/api/routes/R001/baseline');
  });

  it('returns comparison data when baseline is set', async () => {
    const res = await request(app).get('/api/routes/comparison');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('comparison result has required fields', async () => {
    const res = await request(app).get('/api/routes/comparison');
    const first = res.body.data[0];
    expect(first).toHaveProperty('baselineRouteId');
    expect(first).toHaveProperty('comparisonRouteId');
    expect(first).toHaveProperty('baselineIntensity');
    expect(first).toHaveProperty('comparisonIntensity');
    expect(first).toHaveProperty('percentDifference');
    expect(first).toHaveProperty('isCompliant');
  });

  it('calculates correct percentDifference', async () => {
    const res = await request(app).get('/api/routes/comparison');
    // R001 (91.0) vs R002 (88.0): ((88/91) - 1) * 100 ≈ -3.2967
    const r002 = res.body.data.find((r: { comparisonRouteId: string }) => r.comparisonRouteId === 'R002');
    expect(r002?.percentDifference).toBeCloseTo(-3.2967, 2);
  });
});
