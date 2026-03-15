#!/bin/sh
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
node dist/infrastructure/db/seed.js || echo "Seed skipped (already seeded or error)"

echo "🚢 Starting FuelEU Maritime API..."
exec node dist/infrastructure/server/index.js
