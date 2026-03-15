/**
 * ComplianceUseCases — Application Layer
 *
 * Orchestrates compliance balance queries, banking (Article 20),
 * and pooling (Article 21) operations.
 */

import { BankingService } from '../domain/BankingService';
import { PoolingAlgorithm, PoolInput } from '../domain/PoolingAlgorithm';
import {
  AdjustedComplianceBalance,
  BankEntry,
  ComplianceBalanceSummary,
  PoolResult,
  ShipCompliance,
} from '../domain/Compliance';
import { IComplianceRepository } from '../ports/IComplianceRepository';

export interface BankRequestDTO {
  shipId: string;
  year: number;
}

export interface ApplyBankedRequestDTO {
  shipId: string;
  year: number;
}

export interface CreatePoolRequestDTO {
  year: number;
  shipIds: string[];
}

export class ComplianceUseCases {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankingService: BankingService,
    private readonly poolingAlgorithm: PoolingAlgorithm
  ) {}

  // ─── Compliance Balance ───────────────────────────────────────────────────

  /**
   * Get compliance balance summaries for all ships.
   * Includes banked amount and net CB after banking.
   */
  async getComplianceBalances(): Promise<ComplianceBalanceSummary[]> {
    const records = await this.complianceRepo.findAllCompliance();
    const bankEntries = await this.complianceRepo.findAllBankEntries();

    // Aggregate banked amounts by shipId+year
    const bankedMap = new Map<string, number>();
    for (const entry of bankEntries) {
      const key = `${entry.shipId}-${entry.year}`;
      bankedMap.set(key, (bankedMap.get(key) ?? 0) + entry.amountGco2eq);
    }

    return records.map((r) => {
      const key = `${r.shipId}-${r.year}`;
      const banked = bankedMap.get(key) ?? 0;
      return {
        shipId: r.shipId,
        year: r.year,
        cbBefore: r.cbGco2eq,
        banked,
        cbAfter: r.cbGco2eq - banked,
      };
    });
  }

  /**
   * Get all bank entries (history log)
   */
  async getBankingRecords(): Promise<BankEntry[]> {
    return this.complianceRepo.findAllBankEntries();
  }

  /**
   * Get adjusted compliance balances (CB after banking applied).
   * Used to determine pooling eligibility.
   */
  async getAdjustedComplianceBalances(): Promise<AdjustedComplianceBalance[]> {
    return this.complianceRepo.findAdjustedCompliance();
  }

  // ─── Banking (Article 20) ────────────────────────────────────────────────

  /**
   * Bank surplus compliance balance for a ship.
   * The ship's raw CB is stored in ShipCompliance; the banked amount
   * is recorded in BankEntry. The CB in ShipCompliance is NOT reduced
   * here — the adjusted CB is calculated dynamically for display.
   */
  async bankSurplus(dto: BankRequestDTO): Promise<ComplianceBalanceSummary> {
    const compliance = await this.complianceRepo.findCompliance(
      dto.shipId,
      dto.year
    );
    if (!compliance) {
      throw new Error(`No compliance record for ship ${dto.shipId} year ${dto.year}`);
    }

    const existingBanked = await this.complianceRepo.findBankedAmount(
      dto.shipId,
      dto.year
    );
    const available = compliance.cbGco2eq - existingBanked;

    const result = this.bankingService.bankSurplus({
      shipId: dto.shipId,
      year: dto.year,
      cbGco2eq: available,
      existingBanked,
    });

    // Persist the bank entry
    await this.complianceRepo.createBankEntry({
      shipId: dto.shipId,
      year: dto.year,
      amountGco2eq: result.amountBanked,
    });

    const totalBanked = existingBanked + result.amountBanked;

    return {
      shipId: dto.shipId,
      year: dto.year,
      cbBefore: compliance.cbGco2eq,
      banked: totalBanked,
      cbAfter: compliance.cbGco2eq - totalBanked,
    };
  }

  /**
   * Apply previously banked surplus to the current compliance balance.
   * Creates a negative bank entry (withdrawal) and updates the compliance record.
   */
  async applyBanked(dto: ApplyBankedRequestDTO): Promise<ComplianceBalanceSummary> {
    const compliance = await this.complianceRepo.findCompliance(
      dto.shipId,
      dto.year
    );
    if (!compliance) {
      throw new Error(`No compliance record for ship ${dto.shipId} year ${dto.year}`);
    }

    const existingBanked = await this.complianceRepo.findBankedAmount(
      dto.shipId,
      dto.year
    );

    const result = this.bankingService.applyBanked({
      shipId: dto.shipId,
      year: dto.year,
      cbGco2eq: compliance.cbGco2eq,
      existingBanked,
    });

    // Record the withdrawal as a negative bank entry
    await this.complianceRepo.createBankEntry({
      shipId: dto.shipId,
      year: dto.year,
      amountGco2eq: -result.amountApplied,
    });

    // Update the compliance record with new CB
    await this.complianceRepo.updateComplianceCb(dto.shipId, dto.year, result.cbAfter);

    return {
      shipId: dto.shipId,
      year: dto.year,
      cbBefore: result.cbBefore,
      banked: 0, // banked has been applied
      cbAfter: result.cbAfter,
    };
  }

  // ─── Pooling (Article 21) ────────────────────────────────────────────────

  /**
   * Create a compliance pool from a set of ships.
   * Validates pool eligibility and runs the pooling algorithm.
   */
  async createPool(dto: CreatePoolRequestDTO): Promise<PoolResult> {
    if (dto.shipIds.length < 2) {
      throw new Error('A pool must have at least 2 ships');
    }

    // Fetch adjusted CBs for the requested ships
    const adjustedCbs = await this.complianceRepo.findAdjustedCompliance();
    const shipMap = new Map(adjustedCbs.map((a) => [a.shipId, a.adjustedCb]));

    const poolInputs: PoolInput[] = dto.shipIds.map((shipId) => {
      const cb = shipMap.get(shipId);
      if (cb === undefined) {
        throw new Error(`No compliance data for ship ${shipId}`);
      }
      return { shipId, adjustedCb: cb };
    });

    // Run the domain pooling algorithm
    const poolResult = this.poolingAlgorithm.calculate(poolInputs);

    // Persist and return
    return this.complianceRepo.createPool(dto.year, poolResult.members);
  }
}
