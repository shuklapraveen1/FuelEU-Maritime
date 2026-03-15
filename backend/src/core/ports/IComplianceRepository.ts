/**
 * IComplianceRepository — Outbound Port
 *
 * Persistence contract for compliance-related entities:
 * - ShipCompliance (raw CB records)
 * - BankEntry (Article 20 banking records)
 * - Pool + PoolMember (Article 21 pooling records)
 */

import {
  AdjustedComplianceBalance,
  BankEntry,
  PoolResult,
  ShipCompliance,
} from '../domain/Compliance';

export interface IComplianceRepository {
  // ─── Ship Compliance ──────────────────────────────────────────────────────

  /** Get all ship compliance records */
  findAllCompliance(): Promise<ShipCompliance[]>;

  /** Get compliance for a specific ship and year */
  findCompliance(shipId: string, year: number): Promise<ShipCompliance | null>;

  // ─── Banking ──────────────────────────────────────────────────────────────

  /** Get all bank entries */
  findAllBankEntries(): Promise<BankEntry[]>;

  /** Get total banked amount for a ship in a year */
  findBankedAmount(shipId: string, year: number): Promise<number>;

  /** Create a new bank entry (record surplus being banked) */
  createBankEntry(entry: Omit<BankEntry, 'id'>): Promise<BankEntry>;

  /** Update the compliance balance after banking or applying */
  updateComplianceCb(shipId: string, year: number, newCb: number): Promise<ShipCompliance>;

  // ─── Pooling ──────────────────────────────────────────────────────────────

  /**
   * Get adjusted compliance balances (CB after applying banked surplus).
   * Used to determine which ships can participate in pooling.
   */
  findAdjustedCompliance(): Promise<AdjustedComplianceBalance[]>;

  /** Persist a pool and its members */
  createPool(
    year: number,
    members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>
  ): Promise<PoolResult>;

  /** Get all pools */
  findAllPools(): Promise<PoolResult[]>;
}
