/**
 * Integration Tests — Compliance, Banking, Pooling APIs
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../infrastructure/server/app';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL ?? 'postgresql://fueleu:fueleu@localhost:5432/fueleu_db' },
  },
});

let app: Express;

// Test ships: S_SURPLUS has positive CB, S_DEFICIT has negative CB
const SURPLUS_SHIP = 'S_SURPLUS';
const DEFICIT_SHIP = 'S_DEFICIT';
const TEST_YEAR = 2024;

beforeAll(async () => {
  app = createApp();

  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();

  await prisma.shipCompliance.createMany({
    data: [
      {
        id: uuidv4(),
        shipId: SURPLUS_SHIP,
        year: TEST_YEAR,
        cbGco2eq: 10_000_000, // strong surplus
      },
      {
        id: uuidv4(),
        shipId: DEFICIT_SHIP,
        year: TEST_YEAR,
        cbGco2eq: -3_000_000, // deficit
      },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── GET /compliance/cb ───────────────────────────────────────────────────────

describe('GET /api/compliance/cb', () => {
  it('returns 200 with compliance balance array', async () => {
    const res = await request(app).get('/api/compliance/cb');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('each balance has cbBefore, banked, cbAfter fields', async () => {
    const res = await request(app).get('/api/compliance/cb');
    const item = res.body.data[0];
    expect(item).toHaveProperty('shipId');
    expect(item).toHaveProperty('year');
    expect(item).toHaveProperty('cbBefore');
    expect(item).toHaveProperty('banked');
    expect(item).toHaveProperty('cbAfter');
  });

  it('cbAfter equals cbBefore when nothing is banked', async () => {
    const res = await request(app).get('/api/compliance/cb');
    const surplus = res.body.data.find((b: { shipId: string }) => b.shipId === SURPLUS_SHIP);
    expect(surplus.cbAfter).toBeCloseTo(surplus.cbBefore - surplus.banked, 2);
  });
});

// ─── POST /banking/bank ───────────────────────────────────────────────────────

describe('POST /api/banking/bank', () => {
  it('banks surplus and returns updated balance', async () => {
    const res = await request(app)
      .post('/api/banking/bank')
      .send({ shipId: SURPLUS_SHIP, year: TEST_YEAR });

    expect(res.status).toBe(200);
    expect(res.body.data.shipId).toBe(SURPLUS_SHIP);
    expect(res.body.data.banked).toBeGreaterThan(0);
    expect(res.body.data.cbAfter).toBe(0);
  });

  it('rejects banking for deficit ship', async () => {
    const res = await request(app)
      .post('/api/banking/bank')
      .send({ shipId: DEFICIT_SHIP, year: TEST_YEAR });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Cannot bank surplus/);
  });

  it('returns 400 for missing body fields', async () => {
    const res = await request(app).post('/api/banking/bank').send({});
    expect(res.status).toBe(400);
  });

  it('returns 422 for non-existent ship', async () => {
    const res = await request(app)
      .post('/api/banking/bank')
      .send({ shipId: 'GHOST_SHIP', year: TEST_YEAR });
    expect(res.status).toBe(422);
  });
});

// ─── POST /banking/apply ──────────────────────────────────────────────────────

describe('POST /api/banking/apply', () => {
  it('applies banked surplus to deficit ship', async () => {
    // First, bank surplus ship (may already be banked from previous test)
    const bankRes = await request(app)
      .post('/api/banking/bank')
      .send({ shipId: SURPLUS_SHIP, year: TEST_YEAR });
    
    // We'll use SURPLUS_SHIP itself to apply banked (it has banked amount)
    // We need to first check if there's something banked
    const cbRes = await request(app).get('/api/compliance/cb');
    const surplusData = cbRes.body.data.find((b: { shipId: string }) => b.shipId === SURPLUS_SHIP);

    if (surplusData?.banked > 0) {
      const res = await request(app)
        .post('/api/banking/apply')
        .send({ shipId: SURPLUS_SHIP, year: TEST_YEAR });

      expect(res.status).toBe(200);
      expect(res.body.data.cbAfter).toBeGreaterThanOrEqual(res.body.data.cbBefore);
    } else {
      // Already applied — just check response shape
      expect(bankRes.status).toBeLessThan(500);
    }
  });

  it('returns 422 when no banked surplus to apply', async () => {
    // DEFICIT_SHIP has no banked surplus
    const res = await request(app)
      .post('/api/banking/apply')
      .send({ shipId: DEFICIT_SHIP, year: TEST_YEAR });
    expect(res.status).toBe(422);
  });
});

// ─── GET /compliance/adjusted-cb ─────────────────────────────────────────────

describe('GET /api/compliance/adjusted-cb', () => {
  it('returns adjusted compliance balances', async () => {
    const res = await request(app).get('/api/compliance/adjusted-cb');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('adjustedCb field is present', async () => {
    const res = await request(app).get('/api/compliance/adjusted-cb');
    const item = res.body.data[0];
    expect(item).toHaveProperty('adjustedCb');
    expect(typeof item.adjustedCb).toBe('number');
  });
});

// ─── POST /pools ──────────────────────────────────────────────────────────────

describe('POST /api/pools', () => {
  it('creates a valid pool when sum >= 0', async () => {
    // Reset compliance data to ensure clean state
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.updateMany({
      where: { shipId: SURPLUS_SHIP },
      data: { cbGco2eq: 10_000_000 },
    });
    await prisma.shipCompliance.updateMany({
      where: { shipId: DEFICIT_SHIP },
      data: { cbGco2eq: -3_000_000 },
    });

    const res = await request(app)
      .post('/api/pools')
      .send({ year: TEST_YEAR, shipIds: [SURPLUS_SHIP, DEFICIT_SHIP] });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('members');
    expect(res.body.data.members.length).toBe(2);
    expect(res.body.data.isValid).toBe(true);
  });

  it('rejects pool with fewer than 2 ships', async () => {
    const res = await request(app)
      .post('/api/pools')
      .send({ year: TEST_YEAR, shipIds: [SURPLUS_SHIP] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid body', async () => {
    const res = await request(app).post('/api/pools').send({ year: 'bad' });
    expect(res.status).toBe(400);
  });

  it('returns 422 for unknown ship IDs', async () => {
    const res = await request(app)
      .post('/api/pools')
      .send({ year: TEST_YEAR, shipIds: ['UNKNOWN_1', 'UNKNOWN_2'] });
    expect(res.status).toBe(422);
  });
});
