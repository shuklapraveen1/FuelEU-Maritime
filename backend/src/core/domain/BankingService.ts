/**
 * BankingService — Domain Service
 *
 * Implements FuelEU Maritime Article 20 — Banking Mechanism.
 *
 * Rules:
 * - Only surplus CB (cbGco2eq > 0) can be banked
 * - Banked surplus can be applied in the following year
 * - Applied surplus reduces the compliance balance in the target year
 * - CB after banking = CB before - banked amount
 * - CB after applying banked = CB before + applied banked amount
 */

export interface BankingInput {
  shipId: string;
  year: number;
  cbGco2eq: number;        // current compliance balance
  existingBanked: number;  // previously banked (for this ship/year)
}

export interface BankSurplusResult {
  shipId: string;
  year: number;
  amountBanked: number;
  cbBefore: number;
  cbAfter: number;
}

export interface ApplyBankedResult {
  shipId: string;
  year: number;
  amountApplied: number;
  cbBefore: number;
  cbAfter: number;
}

export class BankingService {
  /**
   * Bank all available surplus for a ship.
   * Validation: CB must be positive to bank.
   *
   * cbAfter = 0 (all surplus is moved to the bank)
   */
  bankSurplus(input: BankingInput): BankSurplusResult {
    if (input.cbGco2eq <= 0) {
      throw new Error(
        `Cannot bank surplus: ship ${input.shipId} has no surplus (CB = ${input.cbGco2eq})`
      );
    }

    return {
      shipId: input.shipId,
      year: input.year,
      amountBanked: input.cbGco2eq,
      cbBefore: input.cbGco2eq,
      cbAfter: 0,
    };
  }

  /**
   * Apply banked surplus to the current CB.
   * Validation: must have positive banked amount.
   *
   * cbAfter = cbBefore + existingBanked
   */
  applyBanked(input: BankingInput): ApplyBankedResult {
    if (input.existingBanked <= 0) {
      throw new Error(
        `No banked surplus to apply for ship ${input.shipId}`
      );
    }

    const cbAfter = input.cbGco2eq + input.existingBanked;

    return {
      shipId: input.shipId,
      year: input.year,
      amountApplied: input.existingBanked,
      cbBefore: input.cbGco2eq,
      cbAfter,
    };
  }
}
