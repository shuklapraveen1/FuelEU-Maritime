/**
 * PrismaComplianceRepository — Outbound Adapter
 *
 * Implements IComplianceRepository using Prisma ORM + PostgreSQL.
 */

import {
  BankEntry as PrismaBankEntry,
  PrismaClient,
  ShipCompliance as PrismaShipCompliance,
} from '@prisma/client';
import {
  AdjustedComplianceBalance,
  BankEntry,
  BankEntryProps,
  PoolResult,
  ShipCompliance,
  ShipComplianceProps,
} from '../../../core/domain/Compliance';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';
import { v4 as uuidv4 } from 'uuid';

function toShipComplianceDomain(p: PrismaShipCompliance): ShipCompliance {
  return new ShipCompliance({
    id: p.id,
    shipId: p.shipId,
    year: p.year,
    cbGco2eq: p.cbGco2eq,
  });
}

function toBankEntryDomain(p: PrismaBankEntry): BankEntry {
  return new BankEntry({
    id: p.id,
    shipId: p.shipId,
    year: p.year,
    amountGco2eq: p.amountGco2eq,
  });
}

export class PrismaComplianceRepository implements IComplianceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Ship Compliance ──────────────────────────────────────────────────────

  async findAllCompliance(): Promise<ShipCompliance[]> {
    const records = await this.prisma.shipCompliance.findMany({
      orderBy: [{ year: 'asc' }, { shipId: 'asc' }],
    });
    return records.map(toShipComplianceDomain);
  }

  async findCompliance(
    shipId: string,
    year: number
  ): Promise<ShipCompliance | null> {
    const record = await this.prisma.shipCompliance.findUnique({
      where: { shipId_year: { shipId, year } },
    });
    return record ? toShipComplianceDomain(record) : null;
  }

  // ─── Banking ──────────────────────────────────────────────────────────────

  async findAllBankEntries(): Promise<BankEntry[]> {
    const records = await this.prisma.bankEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toBankEntryDomain);
  }

  async findBankedAmount(shipId: string, year: number): Promise<number> {
    const result = await this.prisma.bankEntry.aggregate({
      where: { shipId, year },
      _sum: { amountGco2eq: true },
    });
    return result._sum.amountGco2eq ?? 0;
  }

  async createBankEntry(entry: Omit<BankEntryProps, 'id'>): Promise<BankEntry> {
    const record = await this.prisma.bankEntry.create({
      data: {
        id: uuidv4(),
        shipId: entry.shipId,
        year: entry.year,
        amountGco2eq: entry.amountGco2eq,
      },
    });
    return toBankEntryDomain(record);
  }

  async updateComplianceCb(
    shipId: string,
    year: number,
    newCb: number
  ): Promise<ShipCompliance> {
    const record = await this.prisma.shipCompliance.update({
      where: { shipId_year: { shipId, year } },
      data: { cbGco2eq: newCb },
    });
    return toShipComplianceDomain(record);
  }

  // ─── Pooling ──────────────────────────────────────────────────────────────

  async findAdjustedCompliance(): Promise<AdjustedComplianceBalance[]> {
    const records = await this.prisma.shipCompliance.findMany();
    const bankEntries = await this.prisma.bankEntry.findMany();

    // Sum bank entries per ship+year
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
        adjustedCb: r.cbGco2eq - banked,
      };
    });
  }

  async createPool(
    year: number,
    members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>
  ): Promise<PoolResult> {
    const pool = await this.prisma.pool.create({
      data: {
        id: uuidv4(),
        year,
        members: {
          create: members.map((m) => ({
            shipId: m.shipId,
            cbBefore: m.cbBefore,
            cbAfter: m.cbAfter,
          })),
        },
      },
      include: { members: true },
    });

    // Determine validity: pool sum after >= 0 AND no constraint violations
    const totalAfter = pool.members.reduce((sum, m) => sum + m.cbAfter, 0);
    const isValid = totalAfter >= -0.001;

    return {
      id: pool.id,
      year: pool.year,
      members: pool.members.map((m) => ({
        shipId: m.shipId,
        cbBefore: m.cbBefore,
        cbAfter: m.cbAfter,
      })),
      isValid,
      createdAt: pool.createdAt,
    };
  }

  async findAllPools(): Promise<PoolResult[]> {
    const pools = await this.prisma.pool.findMany({
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });

    return pools.map((pool) => {
      const totalAfter = pool.members.reduce((sum, m) => sum + m.cbAfter, 0);
      return {
        id: pool.id,
        year: pool.year,
        members: pool.members.map((m) => ({
          shipId: m.shipId,
          cbBefore: m.cbBefore,
          cbAfter: m.cbAfter,
        })),
        isValid: totalAfter >= -0.001,
        createdAt: pool.createdAt,
      };
    });
  }
}
