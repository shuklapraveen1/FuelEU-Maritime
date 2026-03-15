/**
 * Unit Tests — ComplianceCalculator
 */

import { ComplianceCalculator } from '../../../core/domain/ComplianceCalculator';
import { FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ } from '../../../core/domain/Compliance';

describe('ComplianceCalculator', () => {
  let calc: ComplianceCalculator;

  beforeEach(() => {
    calc = new ComplianceCalculator();
  });

  describe('calculateEnergy', () => {
    it('should calculate energy as fuelConsumption × 41,000', () => {
      expect(calc.calculateEnergy(5000)).toBe(205_000_000);
      expect(calc.calculateEnergy(1)).toBe(41_000);
    });

    it('should return 0 for 0 fuel consumption', () => {
      expect(calc.calculateEnergy(0)).toBe(0);
    });
  });

  describe('calculateComplianceBalance', () => {
    it('should return positive CB when intensity is below target (surplus)', () => {
      // R002: ghg=88.0, fuel=4800
      const cb = calc.calculateComplianceBalance({
        ghgIntensity: 88.0,
        fuelConsumption: 4800,
      });
      // (89.3368 - 88.0) * 4800 * 41000 = 1.3368 * 196,800,000
      const expected = (FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ - 88.0) * 4800 * 41_000;
      expect(cb).toBeCloseTo(expected, 2);
      expect(cb).toBeGreaterThan(0);
    });

    it('should return negative CB when intensity exceeds target (deficit)', () => {
      // R001: ghg=91.0, fuel=5000
      const cb = calc.calculateComplianceBalance({
        ghgIntensity: 91.0,
        fuelConsumption: 5000,
      });
      const expected = (FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ - 91.0) * 5000 * 41_000;
      expect(cb).toBeCloseTo(expected, 2);
      expect(cb).toBeLessThan(0);
    });

    it('should return zero when intensity exactly matches target', () => {
      const cb = calc.calculateComplianceBalance({
        ghgIntensity: FUELEU_TARGET_INTENSITY_GCO2EQ_PER_MJ,
        fuelConsumption: 5000,
      });
      expect(cb).toBeCloseTo(0, 5);
    });
  });

  describe('compareRoutes', () => {
    const baseline = { routeId: 'R001', ghgIntensity: 91.0, fuelConsumption: 5000 };
    const greener = { routeId: 'R002', ghgIntensity: 88.0, fuelConsumption: 4800 };
    const worse = { routeId: 'R003', ghgIntensity: 93.5, fuelConsumption: 5100 };
    const compliant = { routeId: 'R004', ghgIntensity: 89.0, fuelConsumption: 4900 };

    it('should calculate negative percentDiff when comparison is greener', () => {
      const result = calc.compareRoutes({ baseline, comparison: greener });
      expect(result.percentDifference).toBeLessThan(0);
      // ((88/91) - 1) * 100 ≈ -3.2967
      expect(result.percentDifference).toBeCloseTo(-3.2967, 2);
    });

    it('should calculate positive percentDiff when comparison is worse', () => {
      const result = calc.compareRoutes({ baseline, comparison: worse });
      expect(result.percentDifference).toBeGreaterThan(0);
    });

    it('should mark route as compliant when intensity <= target', () => {
      const result = calc.compareRoutes({ baseline, comparison: compliant });
      expect(result.isCompliant).toBe(true);
    });

    it('should mark route as non-compliant when intensity > target', () => {
      const result = calc.compareRoutes({ baseline, comparison: worse });
      expect(result.isCompliant).toBe(false);
    });

    it('should throw when baseline intensity is zero', () => {
      const zeroBaseline = { routeId: 'R_ZERO', ghgIntensity: 0, fuelConsumption: 5000 };
      expect(() =>
        calc.compareRoutes({ baseline: zeroBaseline, comparison: greener })
      ).toThrow('Baseline GHG intensity cannot be zero');
    });

    it('should return correct route IDs in result', () => {
      const result = calc.compareRoutes({ baseline, comparison: greener });
      expect(result.baselineRouteId).toBe('R001');
      expect(result.comparisonRouteId).toBe('R002');
    });
  });

  describe('custom target intensity', () => {
    it('should accept a custom target intensity', () => {
      const customCalc = new ComplianceCalculator(100);
      const cb = customCalc.calculateComplianceBalance({
        ghgIntensity: 90,
        fuelConsumption: 1,
      });
      expect(cb).toBeCloseTo((100 - 90) * 41_000, 2);
    });
  });
});
