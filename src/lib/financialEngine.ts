/**
 * Financial Modeling & Industrial Domain Logic Engine
 * DAU-HACKOUT-2026 — Team EVILCODER
 * Author: Hitarth Vyas (Lead Financial Modeling & Domain Logic)
 *
 * Implements:
 * 1. Time-of-Day (ToD) tariff loss modeling for Indian renewable utilities
 * 2. Catastrophic failure risk vs preventative maintenance cost-benefit analysis
 * 3. Asset-level degradation penalty accumulation
 */

export interface TariffStructure {
  baseRatePerKWh: number; // e.g. Rs 6.00 / kWh
  peakMultiplier: number; // e.g. 1.40x during peak grid stress hours
  offPeakMultiplier: number; // e.g. 0.75x during night/off-peak
  currency: string;
}

export const DEFAULT_INDIAN_TARIFF: TariffStructure = {
  baseRatePerKWh: 6.00,
  peakMultiplier: 1.40,
  offPeakMultiplier: 0.75,
  currency: 'INR'
};

export interface FinancialImpactAssessment {
  hourlyLossINR: number;
  dailyProjectedLossINR: number;
  monthlyProjectedLossINR: number;
  preventativeRepairCostINR: number;
  catastrophicFailureCostINR: number;
  netSavingsINR: number;
  roiRatio: number;
}

/**
 * Calculates current tariff rate based on Indian power grid Time-of-Day (ToD) slots:
 * Peak hours: 18:00 - 22:00 (Evening peak) & 06:00 - 09:00 (Morning peak)
 * Off-peak hours: 22:00 - 06:00
 * Normal hours: 09:00 - 18:00
 */
export function getCurrentTariffRate(tariff: TariffStructure = DEFAULT_INDIAN_TARIFF, date = new Date()): number {
  const hour = date.getHours();
  if ((hour >= 18 && hour < 22) || (hour >= 6 && hour < 9)) {
    return Number((tariff.baseRatePerKWh * tariff.peakMultiplier).toFixed(2));
  } else if (hour >= 22 || hour < 6) {
    return Number((tariff.baseRatePerKWh * tariff.offPeakMultiplier).toFixed(2));
  }
  return tariff.baseRatePerKWh;
}

/**
 * Computes preventative maintenance financial return vs catastrophic component failure
 * (e.g. replacing a high-speed bearing early vs gearbox casing destruction)
 */
export function evaluateMaintenanceROI(
  assetCapacityMW: number,
  powerDeficitMW: number,
  probableIssue: string,
  tariff: TariffStructure = DEFAULT_INDIAN_TARIFF
): FinancialImpactAssessment {
  const currentRate = getCurrentTariffRate(tariff);
  const hourlyLossINR = Math.round(powerDeficitMW * 1000 * currentRate);
  const dailyProjectedLossINR = hourlyLossINR * 24;
  const monthlyProjectedLossINR = dailyProjectedLossINR * 30;

  // Industrial benchmark costs (INR) based on component failure severity
  let preventativeRepairCostINR = 45000; // Typical bearing re-greasing / bearing swap
  let catastrophicFailureCostINR = 1850000; // Full drivetrain / gearbox overhaul + crane hire

  if (probableIssue.toLowerCase().includes('generator')) {
    preventativeRepairCostINR = 65000;
    catastrophicFailureCostINR = 2400000;
  } else if (probableIssue.toLowerCase().includes('gearbox')) {
    preventativeRepairCostINR = 95000;
    catastrophicFailureCostINR = 3200000;
  } else if (probableIssue.toLowerCase().includes('soiling')) {
    preventativeRepairCostINR = 12000;
    catastrophicFailureCostINR = 180000;
  }

  const netSavingsINR = catastrophicFailureCostINR - preventativeRepairCostINR;
  const roiRatio = Number((catastrophicFailureCostINR / preventativeRepairCostINR).toFixed(1));

  return {
    hourlyLossINR,
    dailyProjectedLossINR,
    monthlyProjectedLossINR,
    preventativeRepairCostINR,
    catastrophicFailureCostINR,
    netSavingsINR,
    roiRatio
  };
}
