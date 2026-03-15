/**
 * PoolingAlgorithm — Pure Domain Service
 *
 * Implements the FuelEU Maritime Article 21 pooling mechanism.
 *
 * Algorithm:
 * 1. Sort ships by CB descending (surplus ships first)
 * 2. Transfer surplus to deficit ships until deficits are neutralized
 * 3. Enforce constraints:
 *    - A deficit ship cannot exit with a worse (more negative) CB
 *    - A surplus ship cannot exit with a negative CB
 *    - The pool sum must be >= 0
 *
 * Pool validity:
 *    sum(adjustedCB) >= 0 for all members
 */

export interface PoolInput {
  shipId: string;
  adjustedCb: number;
}

export interface PoolMemberResult {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolCalculationResult {
  members: PoolMemberResult[];
  isValid: boolean;
  totalCbBefore: number;
  totalCbAfter: number;
}

export class PoolingAlgorithm {
  /**
   * Calculate the pooling result for a set of ships.
   *
   * Constraints enforced:
   * - A deficit ship cannot leave the pool worse than it entered (cbAfter >= cbBefore for deficits)
   * - A surplus ship cannot exit with negative CB
   * - Pool sum must be >= 0
   */
  calculate(ships: PoolInput[]): PoolCalculationResult {
    if (ships.length < 2) {
      throw new Error('A pool must have at least 2 members');
    }

    // Clone to avoid mutation
    const members: PoolMemberResult[] = ships.map((s) => ({
      shipId: s.shipId,
      cbBefore: s.adjustedCb,
      cbAfter: s.adjustedCb, // start at original CB, will be adjusted
    }));

    const totalCbBefore = members.reduce((sum, m) => sum + m.cbBefore, 0);

    // If pool sum is already negative, the pool is invalid — cannot proceed
    if (totalCbBefore < 0) {
      return {
        members,
        isValid: false,
        totalCbBefore,
        totalCbAfter: totalCbBefore,
      };
    }

    // Sort: surplus ships first (descending CB), deficit ships last
    const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);

    // Collect deficits
    const deficitShips = sorted.filter((m) => m.cbBefore < 0);
    const surplusShips = sorted.filter((m) => m.cbBefore >= 0);

    // For each deficit ship, find surplus to cover it
    for (const deficit of deficitShips) {
      let needed = Math.abs(deficit.cbBefore); // how much surplus this ship needs

      for (const surplus of surplusShips) {
        if (needed <= 0) break;
        if (surplus.cbAfter <= 0) continue; // surplus exhausted

        const available = surplus.cbAfter;
        const transfer = Math.min(available, needed);

        surplus.cbAfter -= transfer;
        deficit.cbAfter += transfer;
        needed -= transfer;
      }
    }

    const totalCbAfter = members.reduce((m) => m, members).reduce(
      (sum, m) => sum + m.cbAfter,
      0
    );

    // Validate constraints
    const isValid = this.validatePool(members, totalCbAfter);

    // Reconstruct results in original order
    const resultMap = new Map(sorted.map((m) => [m.shipId, m.cbAfter]));
    const finalMembers = members.map((m) => ({
      ...m,
      cbAfter: resultMap.get(m.shipId) ?? m.cbAfter,
    }));

    return {
      members: finalMembers,
      isValid,
      totalCbBefore,
      totalCbAfter,
    };
  }

  /**
   * Validate pool constraints:
   * 1. Pool sum >= 0
   * 2. No deficit ship exits worse than it entered
   * 3. No surplus ship exits negative
   */
  private validatePool(
    members: PoolMemberResult[],
    totalCbAfter: number
  ): boolean {
    if (totalCbAfter < -0.001) return false; // allow float rounding

    for (const member of members) {
      // Deficit ship constraint: cbAfter must be >= cbBefore (it must improve or stay same)
      if (member.cbBefore < 0 && member.cbAfter < member.cbBefore - 0.001) {
        return false;
      }
      // Surplus ship constraint: cannot exit negative
      if (member.cbBefore >= 0 && member.cbAfter < -0.001) {
        return false;
      }
    }

    return true;
  }
}
