/**
 * RouteUseCases — Application Layer
 *
 * Orchestrates domain objects and repositories.
 * Does not contain business rules — those live in the domain.
 * Does not contain HTTP concerns — those live in adapters.
 */

import { Route } from '../domain/Route';
import { ComplianceCalculator } from '../domain/ComplianceCalculator';
import { ComparisonResult } from '../domain/ComplianceCalculator';
import { IRouteRepository, RouteFilters } from '../ports/IRouteRepository';

export class RouteUseCases {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly calculator: ComplianceCalculator
  ) {}

  /** List all routes with optional filters */
  async listRoutes(filters?: RouteFilters): Promise<Route[]> {
    return this.routeRepo.findAll(filters);
  }

  /**
   * Set a route as the compliance baseline.
   * Only one baseline can exist at a time — the repository handles clearing the previous one.
   */
  async setBaseline(routeId: string): Promise<Route> {
    const route = await this.routeRepo.findByRouteId(routeId);
    if (!route) {
      throw new Error(`Route not found: ${routeId}`);
    }
    return this.routeRepo.setBaseline(routeId);
  }

  /**
   * Compare all non-baseline routes against the current baseline.
   * Returns an array of comparison results with intensity differences and compliance status.
   */
  async compareRoutes(): Promise<ComparisonResult[]> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      throw new Error('No baseline route has been set. Please set a baseline first.');
    }

    const allRoutes = await this.routeRepo.findAll();
    const comparisons = allRoutes.filter((r) => !r.isBaseline);

    return comparisons.map((route) =>
      this.calculator.compareRoutes({
        baseline: {
          routeId: baseline.routeId,
          ghgIntensity: baseline.ghgIntensity,
          fuelConsumption: baseline.fuelConsumption,
        },
        comparison: {
          routeId: route.routeId,
          ghgIntensity: route.ghgIntensity,
          fuelConsumption: route.fuelConsumption,
        },
      })
    );
  }
}
