/**
 * Compliance Domain Entities
 *
 * FuelEU Maritime Regulation — Article 4 compliance calculations.
 *
 * Key concepts:
 * - Target GHG intensity: 89.3368 gCO2eq/MJ (2025 baseline, tightened every 5 years)
 * - Compliance Balance (CB): Surplus (positive) or deficit (negative) relative to target
 * - CB = (Target − Actual) × Energy
 */

/** FuelEU target GHG intensity in gCO2eq per MJ */
export const FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ = 89.3368;

/** Energy content factor (MJ per tonne of fuel — LCV approximation) */
export const FUEL_ENERGY_FACTOR_MJ_PER_TONNE = 41_000;

export interface ShipComplianceProps {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
}

/**
 * Ship Compliance entity — stores the raw compliance balance for a ship in a given year.
 */
export class ShipCompliance {
  readonly id: string;
  readonly shipId: string;
  readonly year: number;
  readonly cbGco2eq: number; // Compliance Balance in gCO2eq

  constructor(props: ShipComplianceProps) {
    this.id = props.id;
    this.shipId = props.shipId;
    this.year = props.year;
    this.cbGco2eq = props.cbGco2eq;
  }

  get hasSurplus(): boolean {
    return this.cbGco2eq > 0;
  }

  get hasDeficit(): boolean {
    return this.cbGco2eq < 0;
  }
}

export interface BankEntryProps {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

/**
 * Bank Entry entity — represents surplus banked under FuelEU Article 20.
 * Banked surplus can be applied in the following compliance year.
 */
export class BankEntry {
  readonly id: string;
  readonly shipId: string;
  readonly year: number;
  readonly amountGco2eq: number;

  constructor(props: BankEntryProps) {
    this.id = props.id;
    this.shipId = props.shipId;
    this.year = props.year;
    this.amountGco2eq = props.amountGco2eq;
  }
}

export interface PoolMemberResult {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolResult {
  id: string;
  year: number;
  members: PoolMemberResult[];
  isValid: boolean;
  createdAt: Date;
}

/**
 * Compliance Balance summary DTO — used for API responses
 */
export interface ComplianceBalanceSummary {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  cbAfter: number;
}

/**
 * Adjusted CB — CB after applying banked surplus (used for pooling eligibility)
 */
export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  adjustedCb: number;
}
