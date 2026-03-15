-- FuelEU Maritime Compliance Platform — Initial Migration
-- Creates all tables as defined in the Prisma schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "routes" (
    "id"               TEXT NOT NULL,
    "route_id"         TEXT NOT NULL,
    "vessel_type"      TEXT NOT NULL,
    "fuel_type"        TEXT NOT NULL,
    "year"             INTEGER NOT NULL,
    "ghg_intensity"    DOUBLE PRECISION NOT NULL,
    "fuel_consumption" DOUBLE PRECISION NOT NULL,
    "distance"         DOUBLE PRECISION NOT NULL,
    "total_emissions"  DOUBLE PRECISION NOT NULL,
    "is_baseline"      BOOLEAN NOT NULL DEFAULT false,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "routes_route_id_key" ON "routes"("route_id");

CREATE TABLE "ship_compliance" (
    "id"         TEXT NOT NULL,
    "ship_id"    TEXT NOT NULL,
    "year"       INTEGER NOT NULL,
    "cb_gco2eq"  DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ship_compliance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ship_compliance_ship_id_year_key" ON "ship_compliance"("ship_id", "year");

CREATE TABLE "bank_entries" (
    "id"             TEXT NOT NULL,
    "ship_id"        TEXT NOT NULL,
    "year"           INTEGER NOT NULL,
    "amount_gco2eq"  DOUBLE PRECISION NOT NULL,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pools" (
    "id"         TEXT NOT NULL,
    "year"       INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pool_members" (
    "pool_id"   TEXT NOT NULL,
    "ship_id"   TEXT NOT NULL,
    "cb_before" DOUBLE PRECISION NOT NULL,
    "cb_after"  DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pool_members_pkey" PRIMARY KEY ("pool_id","ship_id")
);

ALTER TABLE "pool_members" ADD CONSTRAINT "pool_members_pool_id_fkey"
    FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
