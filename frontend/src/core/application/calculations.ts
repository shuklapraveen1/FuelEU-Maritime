/**
 * Frontend Compliance Calculator (pure functions)
 *
 * Mirrors backend domain logic for client-side computation
 * (e.g., for displaying CB breakdowns without a round-trip).
 */

import { FUELEU_TARGET_INTENSITY } from '../domain/types';

export function calculateEnergy(fuelConsumptionTonnes: number): number {
  return fuelConsumptionTonnes * 41_000;
}

export function calculateComplianceBalance(
  ghgIntensity: number,
  fuelConsumption: number
): number {
  const energy = calculateEnergy(fuelConsumption);
  return (FUELEU_TARGET_INTENSITY - ghgIntensity) * energy;
}

export function formatCB(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} GgCO₂eq`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MgCO₂eq`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)} kgCO₂eq`;
  return `${value.toFixed(0)} gCO₂eq`;
}

export function formatIntensity(value: number): string {
  return `${value.toFixed(4)} gCO₂eq/MJ`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
