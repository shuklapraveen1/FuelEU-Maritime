/**
 * Route Domain Entity
 *
 * Core business object representing a maritime route with fuel and emission data.
 * This is a pure domain object — no framework dependencies, no I/O.
 *
 * FuelEU Maritime Regulation context:
 * - Routes carry GHG intensity (gCO2eq/MJ) data used for compliance checks
 * - A baseline route is used as reference for comparison
 */

export interface RouteProps {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;      // gCO2eq/MJ
  fuelConsumption: number;   // tonnes
  distance: number;          // nautical miles
  totalEmissions: number;    // tonnes CO2eq
  isBaseline: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Route {
  readonly id: string;
  readonly routeId: string;
  readonly vesselType: string;
  readonly fuelType: string;
  readonly year: number;
  readonly ghgIntensity: number;
  readonly fuelConsumption: number;
  readonly distance: number;
  readonly totalEmissions: number;
  readonly isBaseline: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: RouteProps) {
    this.id = props.id;
    this.routeId = props.routeId;
    this.vesselType = props.vesselType;
    this.fuelType = props.fuelType;
    this.year = props.year;
    this.ghgIntensity = props.ghgIntensity;
    this.fuelConsumption = props.fuelConsumption;
    this.distance = props.distance;
    this.totalEmissions = props.totalEmissions;
    this.isBaseline = props.isBaseline;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Energy content of the route's fuel consumption
   * Formula: fuelConsumption (tonnes) × 41,000 MJ/tonne (lower calorific value approximation)
   */
  get energyMJ(): number {
    return this.fuelConsumption * 41_000;
  }

  /**
   * Mark this route as a baseline for comparison.
   * Returns a new immutable Route instance (value-object pattern).
   */
  withBaseline(isBaseline: boolean): Route {
    return new Route({ ...this.toProps(), isBaseline });
  }

  toProps(): RouteProps {
    return {
      id: this.id,
      routeId: this.routeId,
      vesselType: this.vesselType,
      fuelType: this.fuelType,
      year: this.year,
      ghgIntensity: this.ghgIntensity,
      fuelConsumption: this.fuelConsumption,
      distance: this.distance,
      totalEmissions: this.totalEmissions,
      isBaseline: this.isBaseline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
