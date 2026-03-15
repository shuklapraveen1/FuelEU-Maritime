/**
 * PrismaRouteRepository — Outbound Adapter
 *
 * Implements IRouteRepository using Prisma ORM + PostgreSQL.
 * Maps Prisma model DTOs → Domain entities.
 */

import { PrismaClient, Route as PrismaRoute } from '@prisma/client';
import { Route, RouteProps } from '../../../core/domain/Route';
import {
  IRouteRepository,
  RouteFilters,
} from '../../../core/ports/IRouteRepository';
import { v4 as uuidv4 } from 'uuid';

function toDomain(p: PrismaRoute): Route {
  return new Route({
    id: p.id,
    routeId: p.routeId,
    vesselType: p.vesselType,
    fuelType: p.fuelType,
    year: p.year,
    ghgIntensity: p.ghgIntensity,
    fuelConsumption: p.fuelConsumption,
    distance: p.distance,
    totalEmissions: p.totalEmissions,
    isBaseline: p.isBaseline,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  });
}

export class PrismaRouteRepository implements IRouteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const records = await this.prisma.route.findMany({
      where: {
        ...(filters?.vesselType && { vesselType: filters.vesselType }),
        ...(filters?.fuelType && { fuelType: filters.fuelType }),
        ...(filters?.year && { year: filters.year }),
      },
      orderBy: { year: 'asc' },
    });
    return records.map(toDomain);
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const record = await this.prisma.route.findUnique({
      where: { routeId },
    });
    return record ? toDomain(record) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const record = await this.prisma.route.findFirst({
      where: { isBaseline: true },
    });
    return record ? toDomain(record) : null;
  }

  async setBaseline(routeId: string): Promise<Route> {
    // Use a transaction to ensure only one baseline exists
    const updated = await this.prisma.$transaction(async (tx) => {
      // Clear all existing baselines
      await tx.route.updateMany({
        where: { isBaseline: true },
        data: { isBaseline: false },
      });

      // Set the new baseline
      return tx.route.update({
        where: { routeId },
        data: { isBaseline: true },
      });
    });

    return toDomain(updated);
  }

  async create(
    route: Omit<RouteProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Route> {
    const record = await this.prisma.route.create({
      data: {
        id: uuidv4(),
        routeId: route.routeId,
        vesselType: route.vesselType,
        fuelType: route.fuelType,
        year: route.year,
        ghgIntensity: route.ghgIntensity,
        fuelConsumption: route.fuelConsumption,
        distance: route.distance,
        totalEmissions: route.totalEmissions,
        isBaseline: route.isBaseline,
      },
    });
    return toDomain(record);
  }
}
