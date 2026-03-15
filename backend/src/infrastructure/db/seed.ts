/**
 * Database Seed Script
 *
 * Seeds the database with:
 * - 5 routes (R001–R005)
 * - 5 ship compliance records (computed from route data)
 *
 * Run: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Compute compliance balance from route data.
 * CB = (Target − Actual) × fuelConsumption × 41,000
 */
function calcCB(ghgIntensity: number, fuelConsumption: number): number {
  const TARGET = 89.3368;
  const ENERGY_FACTOR = 41_000;
  return (TARGET - ghgIntensity) * fuelConsumption * ENERGY_FACTOR;
}

const routes = [
  {
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: false,
  },
  {
    routeId: 'R002',
    vesselType: 'BulkCarrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false,
  },
  {
    routeId: 'R003',
    vesselType: 'Tanker',
    fuelType: 'MGO',
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumption: 5100,
    distance: 12500,
    totalEmissions: 4700,
    isBaseline: false,
  },
  {
    routeId: 'R004',
    vesselType: 'RoRo',
    fuelType: 'HFO',
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumption: 4900,
    distance: 11800,
    totalEmissions: 4300,
    isBaseline: false,
  },
  {
    routeId: 'R005',
    vesselType: 'Container',
    fuelType: 'LNG',
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumption: 4950,
    distance: 11900,
    totalEmissions: 4400,
    isBaseline: false,
  },
];

const shipCompliance = routes.map((r) => ({
  id: uuidv4(),
  shipId: r.routeId,
  year: r.year,
  cbGco2eq: calcCB(r.ghgIntensity, r.fuelConsumption),
}));

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.route.deleteMany();

  // Insert routes
  for (const route of routes) {
    await prisma.route.create({
      data: { id: uuidv4(), ...route },
    });
  }
  console.log(`✅ Inserted ${routes.length} routes`);

  // Insert ship compliance records
  for (const sc of shipCompliance) {
    await prisma.shipCompliance.create({ data: sc });
  }
  console.log(`✅ Inserted ${shipCompliance.length} ship compliance records`);

  console.log('\n📊 Compliance Balances:');
  for (const sc of shipCompliance) {
    const sign = sc.cbGco2eq > 0 ? '+' : '';
    console.log(
      `   ${sc.shipId} (${sc.year}): ${sign}${sc.cbGco2eq.toLocaleString()} gCO2eq`
    );
  }

  console.log('\n🚢 Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
