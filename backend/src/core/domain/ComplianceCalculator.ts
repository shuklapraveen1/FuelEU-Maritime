/**
 * ComplianceCalculator — Pure Domain Service
 *
 * Implements the FuelEU Maritime compliance balance formula from Article 4.
 * No I/O, no framework dependencies. Fully unit-testable.
 *
 * Formula:
 *   energy     = fuelConsumption × 41,000 MJ
 *   CB         = (targetIntensity − actualIntensity) × energy
 *
 * Positive CB → surplus (ship is greener than target)
 * Negative CB → deficit (ship exceeds target)
 */

import {
  FUEL_ENERGY_FACTOR_MJ_PER_TONNE,
  FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ,
} from './Compliance';

export interface RouteComplianceInput {
  ghgIntensity: number;     // gCO2eq/MJ
  fuelConsumption: number;  // tonnes
}

export interface RouteComparisonInput {
  baseline: RouteComplianceInput & { routeId: string };
  comparison: RouteComplianceInput & { routeId: string };
}

export interface ComparisonResult {
  baselineRouteId: string;
  comparisonRouteId: string;
  baselineIntensity: number;
  comparisonIntensity: number;
  percentDifference: number;
  isCompliant: boolean;
}

export class ComplianceCalculator {
  private readonly targetIntensity: number;

  constructor(
    targetIntensity: number = FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ
  ) {
    this.targetIntensity = targetIntensity;
  }

  /**
   * Calculate energy content from fuel consumption.
   * Uses Lower Calorific Value (LCV) approximation of 41,000 MJ/tonne.
   */
  calculateEnergy(fuelConsumptionTonnes: number): number {
    return fuelConsumptionTonnes * FUEL_ENERGY_FACTOR_MJ_PER_TONNE;
  }

  /**
   * Calculate Compliance Balance (CB) for a single route/ship.
   *
   * CB > 0 → surplus (below target intensity)
   * CB < 0 → deficit (above target intensity)
   */
  calculateComplianceBalance(input: RouteComplianceInput): number {
    const energy = this.calculateEnergy(input.fuelConsumption);
    return (this.targetIntensity - input.ghgIntensity) * energy;
  }

  /**
   * Compare two routes and calculate the percent difference in GHG intensity.
   *
   * percentDiff = ((comparison / baseline) − 1) × 100
   *
   * Negative percentDiff → comparison is greener
   * Positive percentDiff → comparison is worse
   */
  compareRoutes(input: RouteComparisonInput): ComparisonResult {
    const { baseline, comparison } = input;

    if (baseline.ghgIntensity === 0) {
      throw new Error('Baseline GHG intensity cannot be zero');
    }

    const percentDifference =
      ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;

    // Compliant means the comparison route is at or below target
    const isCompliant = comparison.ghgIntensity <= this.targetIntensity;

    return {
      baselineRouteId: baseline.routeId,
      comparisonRouteId: comparison.routeId,
      baselineIntensity: baseline.ghgIntensity,
      comparisonIntensity: comparison.ghgIntensity,
      percentDifference: parseFloat(percentDifference.toFixed(4)),
      isCompliant,
    };
  }
}
