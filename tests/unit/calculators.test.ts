import { describe, it, expect } from "vitest";
import {
  calculateRentalYield,
  calculateRoi,
  calculateMortgage,
  minimumDownPaymentPercent,
  calculateAffordability,
  calculateCapitalAppreciation,
  compareInvestments,
  calculateOffPlanPaymentPlan,
} from "@/lib/calculators";

describe("Investor Tools calculators (spec §26)", () => {
  it("calculates gross and net rental yield correctly", () => {
    const result = calculateRentalYield({ price: 1000000, annualRent: 70000, annualExpenses: 10000 });
    expect(result.grossYieldPercent).toBe(7);
    expect(result.netYieldPercent).toBe(6);
  });

  it("calculates ROI including acquisition costs", () => {
    const result = calculateRoi({ purchasePrice: 1000000, annualRentalIncome: 60000, annualExpenses: 5000, acquisitionCosts: 40000 });
    expect(result.grossRoiPercent).toBeCloseTo((60000 / 1040000) * 100, 2);
    expect(result.netRoiPercent).toBeCloseTo((55000 / 1040000) * 100, 2);
  });

  it("calculates a standard amortizing mortgage payment", () => {
    // Standard amortization formula reference: 800,000 loan, 4% annual, 25 years -> AED 4,222.69/month
    const result = calculateMortgage({ price: 1000000, downPaymentPercent: 20, annualInterestRatePercent: 4, termYears: 25 });
    expect(result.loanAmount).toBe(800000);
    expect(result.monthlyPayment).toBeCloseTo(4222.69, 1);
    expect(result.totalRepayment).toBeGreaterThan(result.loanAmount);
    expect(result.totalInterest).toBeCloseTo(result.totalRepayment - result.loanAmount, 2);
  });

  it("handles a zero-interest mortgage without dividing by zero", () => {
    const result = calculateMortgage({ price: 1000000, downPaymentPercent: 20, annualInterestRatePercent: 0, termYears: 10 });
    expect(result.monthlyPayment).toBeCloseTo(800000 / 120, 2);
    expect(result.totalInterest).toBeCloseTo(0, 2);
  });

  it("applies UAE mortgage cap tiers for minimum down payment", () => {
    expect(minimumDownPaymentPercent(3_000_000, true)).toBe(20);
    expect(minimumDownPaymentPercent(6_000_000, true)).toBe(25);
    expect(minimumDownPaymentPercent(3_000_000, false)).toBe(40);
  });

  it("calculates affordability consistent with the mortgage formula (round-trip)", () => {
    const affordability = calculateAffordability({
      monthlyIncome: 30000,
      existingMonthlyDebts: 2000,
      annualInterestRatePercent: 4,
      termYears: 25,
      downPaymentPercent: 20,
    });
    expect(affordability.maxMonthlyPayment).toBe(13000);

    const mortgage = calculateMortgage({
      price: affordability.maxPropertyPrice,
      downPaymentPercent: 20,
      annualInterestRatePercent: 4,
      termYears: 25,
    });
    expect(mortgage.monthlyPayment).toBeCloseTo(affordability.maxMonthlyPayment, 0);
  });

  it("compounds capital appreciation correctly over multiple years", () => {
    const result = calculateCapitalAppreciation({ currentValue: 1000000, annualAppreciationRatePercent: 5, years: 3 });
    expect(result.futureValue).toBeCloseTo(1000000 * Math.pow(1.05, 3), 2);
  });

  it("ranks investment comparisons by total return percent, highest first", () => {
    const results = compareInvestments([
      { label: "Low yield", price: 1000000, annualRent: 30000, annualAppreciationRatePercent: 2, years: 5 },
      { label: "High yield", price: 1000000, annualRent: 80000, annualAppreciationRatePercent: 5, years: 5 },
    ]);
    expect(results[0]?.label).toBe("High yield");
    expect(results[0]!.totalReturnPercent).toBeGreaterThan(results[1]!.totalReturnPercent);
  });

  it("splits an off-plan payment plan by its stated ratio", () => {
    const result = calculateOffPlanPaymentPlan({ price: 1000000, plan: "60/40", constructionInstallments: 6 });
    expect(result?.constructionTotal).toBe(600000);
    expect(result?.handoverTotal).toBe(400000);
    expect(result?.perInstallment).toBe(100000);
  });

  it("rejects a malformed payment plan instead of guessing", () => {
    expect(calculateOffPlanPaymentPlan({ price: 1000000, plan: "not-a-plan", constructionInstallments: 4 })).toBeNull();
    expect(calculateOffPlanPaymentPlan({ price: 1000000, plan: "70/50", constructionInstallments: 4 })).toBeNull();
  });
});
