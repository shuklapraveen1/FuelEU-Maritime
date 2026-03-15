/**
 * IRouteRepository — Outbound Port
 *
 * Defines the persistence contract for Route entities.
 * The domain layer depends on this interface; infrastructure implements it.
 * This is the classic Hexagonal Architecture "right-side" port.
 */

import { Route } from '../domain/Route';

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export interface IRouteRepository {
  /** Retrieve all routes, optionally filtered */
  findAll(filters?: RouteFilters): Promise<Route[]>;

  /** Find a single route by its business routeId */
  findByRouteId(routeId: string): Promise<Route | null>;

  /** Find the current baseline route */
  findBaseline(): Promise<Route | null>;

  /** Mark a route as the baseline (clears any existing baseline first) */
  setBaseline(routeId: string): Promise<Route>;

  /** Persist a new route */
  create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route>;
}
