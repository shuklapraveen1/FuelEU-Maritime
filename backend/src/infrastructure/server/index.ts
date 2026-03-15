/**
 * Server Entry Point
 */

import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function main() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`\n🚢  FuelEU Maritime API running on http://localhost:${PORT}`);
    console.log(`📖  Swagger docs at http://localhost:${PORT}/api-docs\n`);
  });
}

main().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
