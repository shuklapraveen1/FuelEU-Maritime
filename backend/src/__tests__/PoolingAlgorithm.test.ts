/**
 * Unit Tests — PoolingAlgorithm (Article 21)
 */

import { PoolingAlgorithm } from '../../../core/domain/PoolingAlgorithm';

describe('PoolingAlgorithm', () => {
  let algo: PoolingAlgorithm;

  beforeEach(() => {
    algo = new PoolingAlgorithm();
  });

  describe('basic pooling', () => {
    it('should transfer surplus from surplus ship to deficit ship', () => {
      const result = algo.calculate([
        { shipId: 'SURPLUS', adjustedCb: 3_000_000 },
        { shipId: 'DEFICIT', adjustedCb: -1_000_000 },
      ]);

      expect(result.isValid).toBe(true);

      const surplus = result.members.find((m) => m.shipId === 'SURPLUS')!;
      const deficit = result.members.find((m) => m.shipId === 'DEFICIT')!;

      expect(deficit.cbAfter).toBeCloseTo(0, 2);     // deficit neutralized
      expect(surplus.cbAfter).toBeCloseTo(2_000_000, 2); // surplus reduced
    });

    it('should handle multiple deficit ships', () => {
      const result = algo.calculate([
        { shipId: 'S1', adjustedCb: 5_000_000 },
        { shipId: 'D1', adjustedCb: -1_000_000 },
        { shipId: 'D2', adjustedCb: -2_000_000 },
      ]);

      expect(result.isValid).toBe(true);

      const s1 = result.members.find((m) => m.shipId === 'S1')!;
      const d1 = result.members.find((m) => m.shipId === 'D1')!;
      const d2 = result.members.find((m) => m.shipId === 'D2')!;

      expect(d1.cbAfter).toBeGreaterThanOrEqual(0);
      expect(d2.cbAfter).toBeGreaterThanOrEqual(0);
      expect(s1.cbAfter).toBeGreaterThanOrEqual(0); // surplus cannot go negative
    });

    it('should return invalid when pool total is negative', () => {
      const result = algo.calculate([
        { shipId: 'S1', adjustedCb: 1_000_000 },
        { shipId: 'D1', adjustedCb: -3_000_000 }, // deficit exceeds surplus
      ]);

      expect(result.isValid).toBe(false);
    });

    it('should handle a pool of all surplus ships', () => {
      const result = algo.calculate([
        { shipId: 'S1', adjustedCb: 2_000_000 },
        { shipId: 'S2', adjustedCb: 1_000_000 },
      ]);

      expect(result.isValid).toBe(true);
      // No transfers needed — all remain at their original CBs
      const s1 = result.members.find((m) => m.shipId === 'S1')!;
      expect(s1.cbAfter).toBe(s1.cbBefore);
    });
  });

  describe('constraints', () => {
    it('should not allow surplus ship to exit with negative CB', () => {
      const result = algo.calculate([
        { shipId: 'S1', adjustedCb: 1_000_000 },
        { shipId: 'D1', adjustedCb: -5_000_000 }, // needs more than available
      ]);

      const s1 = result.members.find((m) => m.shipId === 'S1')!;
      expect(s1.cbAfter).toBeGreaterThanOrEqual(0);
      expect(result.isValid).toBe(false); // pool still invalid
    });

    it('should throw when fewer than 2 ships', () => {
      expect(() =>
        algo.calculate([{ shipId: 'S1', adjustedCb: 1_000_000 }])
      ).toThrow('at least 2 members');
    });

    it('should correctly compute totalCbBefore and totalCbAfter', () => {
      const result = algo.calculate([
        { shipId: 'S1', adjustedCb: 3_000_000 },
        { shipId: 'D1', adjustedCb: -1_000_000 },
      ]);

      expect(result.totalCbBefore).toBeCloseTo(2_000_000, 2);
      expect(result.totalCbAfter).toBeCloseTo(2_000_000, 2); // conservation of CB
    });
  });

  describe('seed data scenario', () => {
    it('should correctly pool R002 (surplus) with R001 (deficit)', () => {
      // R001: CB = (89.3368 - 91.0) * 5000 * 41000 = -340,244,000
      // R002: CB = (89.3368 - 88.0) * 4800 * 41000 = +263,140,480
      const r001Cb = (89.3368 - 91.0) * 5000 * 41000;
      const r002Cb = (89.3368 - 88.0) * 4800 * 41000;

      const result = algo.calculate([
        { shipId: 'R001', adjustedCb: r001Cb },
        { shipId: 'R002', adjustedCb: r002Cb },
      ]);

      // Pool sum = r001Cb + r002Cb — if negative, pool is invalid
      const sum = r001Cb + r002Cb;
      expect(result.isValid).toBe(sum >= 0);
    });
  });
});
