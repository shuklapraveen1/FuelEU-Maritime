/**
 * Frontend Domain Types
 *
 * Mirror of the backend domain, but purely as TypeScript interfaces
 * for use in the React application. No framework coupling.
 */

// ─── Routes ───────────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteComparison {
  baselineRouteId: string;
  comparisonRouteId: string;
  baselineIntensity: number;
  comparisonIntensity: number;
  percentDifference: number;
  isCompliant: boolean;
}

// ─── Compliance Balance ───────────────────────────────────────────────────────

export interface ComplianceBalance {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  cbAfter: number;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  adjustedCb: number;
}

// ─── Banking ──────────────────────────────────────────────────────────────────

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

// ─── Pooling ──────────────────────────────────────────────────────────────────

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  members: PoolMember[];
  isValid: boolean;
  createdAt: string;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const FUELEU_TARGET_INTENSITY = 89.3368; // gCO2eq/MJ
