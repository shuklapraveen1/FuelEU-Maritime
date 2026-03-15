/**
 * Unit Tests — BankingService (Article 20)
 */

import { BankingService } from '../../../core/domain/BankingService';

describe('BankingService', () => {
  let service: BankingService;

  beforeEach(() => {
    service = new BankingService();
  });

  describe('bankSurplus', () => {
    it('should bank the full surplus CB', () => {
      const result = service.bankSurplus({
        shipId: 'R002',
        year: 2024,
        cbGco2eq: 5_000_000,
        existingBanked: 0,
      });

      expect(result.amountBanked).toBe(5_000_000);
      expect(result.cbBefore).toBe(5_000_000);
      expect(result.cbAfter).toBe(0);
      expect(result.shipId).toBe('R002');
      expect(result.year).toBe(2024);
    });

    it('should throw when CB is zero or negative', () => {
      expect(() =>
        service.bankSurplus({
          shipId: 'R001',
          year: 2024,
          cbGco2eq: 0,
          existingBanked: 0,
        })
      ).toThrow('Cannot bank surplus');

      expect(() =>
        service.bankSurplus({
          shipId: 'R001',
          year: 2024,
          cbGco2eq: -1_000_000,
          existingBanked: 0,
        })
      ).toThrow('Cannot bank surplus');
    });
  });

  describe('applyBanked', () => {
    it('should apply banked amount to current CB', () => {
      const result = service.applyBanked({
        shipId: 'R001',
        year: 2024,
        cbGco2eq: -2_000_000,
        existingBanked: 3_000_000,
      });

      expect(result.amountApplied).toBe(3_000_000);
      expect(result.cbBefore).toBe(-2_000_000);
      expect(result.cbAfter).toBe(1_000_000); // -2M + 3M
    });

    it('should throw when no banked surplus exists', () => {
      expect(() =>
        service.applyBanked({
          shipId: 'R001',
          year: 2024,
          cbGco2eq: -1_000_000,
          existingBanked: 0,
        })
      ).toThrow('No banked surplus');
    });

    it('should handle applying banked to already-positive CB', () => {
      const result = service.applyBanked({
        shipId: 'R002',
        year: 2024,
        cbGco2eq: 500_000,
        existingBanked: 1_000_000,
      });

      expect(result.cbAfter).toBe(1_500_000);
    });
  });
});
