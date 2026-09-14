/**
 * Investor Tools (spec §26) — pure, deterministic financial formulas.
 * No network calls, no fabricated data: every result is a direct
 * calculation from the caller's own inputs.
 */

export interface RentalYieldInput {
  price: number;
  annualRent: number;
  annualExpenses?: number;
}

export interface RentalYieldResult {
  grossYieldPercent: number;
  netYieldPercent: number;
}

export function calculateRentalYield(input: RentalYieldInput): RentalYieldResult {
  const expenses = input.annualExpenses ?? 0;
  return {
    grossYieldPercent: round((input.annualRent / input.price) * 100),
    netYieldPercent: round(((input.annualRent - expenses) / input.price) * 100),
  };
}

export interface RoiInput {
  purchasePrice: number;
  annualRentalIncome: number;
  annualExpenses?: number;
  acquisitionCosts?: number;
}

export interface RoiResult {
  grossRoiPercent: number;
  netRoiPercent: number;
}

export function calculateRoi(input: RoiInput): RoiResult {
  const expenses = input.annualExpenses ?? 0;
  const acquisitionCosts = input.acquisitionCosts ?? 0;
  const totalInvestment = input.purchasePrice + acquisitionCosts;
  return {
    grossRoiPercent: round((input.annualRentalIncome / totalInvestment) * 100),
    netRoiPercent: round(((input.annualRentalIncome - expenses) / totalInvestment) * 100),
  };
}

export interface MortgageInput {
  price: number;
  downPaymentPercent: number;
  annualInterestRatePercent: number;
  termYears: number;
}

export interface MortgageResult {
  loanAmount: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const loanAmount = input.price * (1 - input.downPaymentPercent / 100);
  const monthlyRate = input.annualInterestRatePercent / 100 / 12;
  const numPayments = input.termYears * 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

  const totalRepayment = monthlyPayment * numPayments;

  return {
    loanAmount: round(loanAmount),
    monthlyPayment: round(monthlyPayment),
    totalRepayment: round(totalRepayment),
    totalInterest: round(totalRepayment - loanAmount),
  };
}

/** UAE Central Bank mortgage cap guidance: min down payment by price tier. */
export function minimumDownPaymentPercent(price: number, isFirstProperty: boolean): number {
  if (!isFirstProperty) return 40;
  return price > 5_000_000 ? 25 : 20;
}

export interface AffordabilityInput {
  monthlyIncome: number;
  existingMonthlyDebts?: number;
  annualInterestRatePercent: number;
  termYears: number;
  downPaymentPercent: number;
  maxDebtBurdenRatioPercent?: number;
}

export interface AffordabilityResult {
  maxMonthlyPayment: number;
  maxLoanAmount: number;
  maxPropertyPrice: number;
}

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const maxDbr = input.maxDebtBurdenRatioPercent ?? 50;
  const existingDebts = input.existingMonthlyDebts ?? 0;
  const maxMonthlyPayment = Math.max(0, (input.monthlyIncome * maxDbr) / 100 - existingDebts);

  const monthlyRate = input.annualInterestRatePercent / 100 / 12;
  const numPayments = input.termYears * 12;

  const maxLoanAmount =
    monthlyRate === 0
      ? maxMonthlyPayment * numPayments
      : (maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

  const maxPropertyPrice = maxLoanAmount / (1 - input.downPaymentPercent / 100);

  return {
    maxMonthlyPayment: round(maxMonthlyPayment),
    maxLoanAmount: round(maxLoanAmount),
    maxPropertyPrice: round(maxPropertyPrice),
  };
}

export interface CapitalAppreciationInput {
  currentValue: number;
  annualAppreciationRatePercent: number;
  years: number;
}

export interface CapitalAppreciationResult {
  futureValue: number;
  totalAppreciation: number;
}

export function calculateCapitalAppreciation(input: CapitalAppreciationInput): CapitalAppreciationResult {
  const futureValue = input.currentValue * Math.pow(1 + input.annualAppreciationRatePercent / 100, input.years);
  return {
    futureValue: round(futureValue),
    totalAppreciation: round(futureValue - input.currentValue),
  };
}

export interface InvestmentComparisonInput {
  label: string;
  price: number;
  annualRent: number;
  annualExpenses?: number;
  annualAppreciationRatePercent: number;
  years: number;
}

export interface InvestmentComparisonResult {
  label: string;
  totalRentalIncome: number;
  totalAppreciation: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export function compareInvestments(inputs: InvestmentComparisonInput[]): InvestmentComparisonResult[] {
  return inputs
    .map((input) => {
      const netAnnualRent = input.annualRent - (input.annualExpenses ?? 0);
      const totalRentalIncome = netAnnualRent * input.years;
      const { totalAppreciation } = calculateCapitalAppreciation({
        currentValue: input.price,
        annualAppreciationRatePercent: input.annualAppreciationRatePercent,
        years: input.years,
      });
      const totalReturn = totalRentalIncome + totalAppreciation;
      return {
        label: input.label,
        totalRentalIncome: round(totalRentalIncome),
        totalAppreciation: round(totalAppreciation),
        totalReturn: round(totalReturn),
        totalReturnPercent: round((totalReturn / input.price) * 100),
      };
    })
    .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
}

export interface OffPlanPaymentPlanInput {
  price: number;
  /** e.g. "60/40" — percent during construction / percent on handover. */
  plan: string;
  constructionInstallments: number;
}

export interface OffPlanPaymentPlanResult {
  constructionPercent: number;
  handoverPercent: number;
  constructionTotal: number;
  handoverTotal: number;
  perInstallment: number;
}

export function calculateOffPlanPaymentPlan(input: OffPlanPaymentPlanInput): OffPlanPaymentPlanResult | null {
  const parts = input.plan.split("/").map((p) => Number(p.trim()));
  if (parts.length !== 2 || parts.some((p) => Number.isNaN(p)) || parts[0]! + parts[1]! !== 100) {
    return null;
  }
  const [constructionPercent, handoverPercent] = parts as [number, number];
  const constructionTotal = round((input.price * constructionPercent) / 100);
  const handoverTotal = round((input.price * handoverPercent) / 100);
  const perInstallment = round(constructionTotal / Math.max(1, input.constructionInstallments));

  return { constructionPercent, handoverPercent, constructionTotal, handoverTotal, perInstallment };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
