"use client";

import { useMemo, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { formatAed } from "@/lib/utils/format";
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

const TABS = [
  "Rental Yield",
  "ROI",
  "Mortgage",
  "Affordability",
  "Down Payment",
  "Capital Appreciation",
  "Investment Comparison",
  "Off-Plan Payment Plan",
] as const;

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <Label>{label}{suffix ? ` (${suffix})` : ""}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal/10 py-2 text-sm last:border-0">
      <span className="text-charcoal/60">{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function CalculatorsPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Rental Yield");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "focus-ring rounded-full border px-4 py-2 text-sm",
              tab === t ? "border-champagne bg-champagne/20 text-charcoal" : "border-charcoal/15 text-charcoal/60",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-6">
        {tab === "Rental Yield" && <RentalYieldCalc />}
        {tab === "ROI" && <RoiCalc />}
        {tab === "Mortgage" && <MortgageCalc />}
        {tab === "Affordability" && <AffordabilityCalc />}
        {tab === "Down Payment" && <DownPaymentCalc />}
        {tab === "Capital Appreciation" && <CapitalAppreciationCalc />}
        {tab === "Investment Comparison" && <InvestmentComparisonCalc />}
        {tab === "Off-Plan Payment Plan" && <OffPlanCalc />}
      </Card>
    </div>
  );
}

function RentalYieldCalc() {
  const [price, setPrice] = useState("1000000");
  const [annualRent, setAnnualRent] = useState("70000");
  const [annualExpenses, setAnnualExpenses] = useState("10000");
  const result = useMemo(() => calculateRentalYield({ price: num(price), annualRent: num(annualRent), annualExpenses: num(annualExpenses) }), [price, annualRent, annualExpenses]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Property price" value={price} onChange={setPrice} suffix="AED" />
        <Field label="Annual rent" value={annualRent} onChange={setAnnualRent} suffix="AED" />
        <Field label="Annual expenses" value={annualExpenses} onChange={setAnnualExpenses} suffix="AED" />
      </div>
      <div>
        <ResultRow label="Gross yield" value={`${result.grossYieldPercent}%`} />
        <ResultRow label="Net yield" value={`${result.netYieldPercent}%`} />
      </div>
    </div>
  );
}

function RoiCalc() {
  const [purchasePrice, setPurchasePrice] = useState("1000000");
  const [annualRentalIncome, setAnnualRentalIncome] = useState("70000");
  const [annualExpenses, setAnnualExpenses] = useState("10000");
  const [acquisitionCosts, setAcquisitionCosts] = useState("40000");
  const result = useMemo(
    () => calculateRoi({ purchasePrice: num(purchasePrice), annualRentalIncome: num(annualRentalIncome), annualExpenses: num(annualExpenses), acquisitionCosts: num(acquisitionCosts) }),
    [purchasePrice, annualRentalIncome, annualExpenses, acquisitionCosts],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Purchase price" value={purchasePrice} onChange={setPurchasePrice} suffix="AED" />
        <Field label="Annual rental income" value={annualRentalIncome} onChange={setAnnualRentalIncome} suffix="AED" />
        <Field label="Annual expenses" value={annualExpenses} onChange={setAnnualExpenses} suffix="AED" />
        <Field label="Acquisition costs (fees)" value={acquisitionCosts} onChange={setAcquisitionCosts} suffix="AED" />
      </div>
      <div>
        <ResultRow label="Gross ROI" value={`${result.grossRoiPercent}%`} />
        <ResultRow label="Net ROI" value={`${result.netRoiPercent}%`} />
      </div>
    </div>
  );
}

function MortgageCalc() {
  const [price, setPrice] = useState("1000000");
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [rate, setRate] = useState("4");
  const [termYears, setTermYears] = useState("25");
  const result = useMemo(
    () => calculateMortgage({ price: num(price), downPaymentPercent: num(downPaymentPercent), annualInterestRatePercent: num(rate), termYears: num(termYears) }),
    [price, downPaymentPercent, rate, termYears],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Property price" value={price} onChange={setPrice} suffix="AED" />
        <Field label="Down payment" value={downPaymentPercent} onChange={setDownPaymentPercent} suffix="%" />
        <Field label="Annual interest rate" value={rate} onChange={setRate} suffix="%" />
        <Field label="Term" value={termYears} onChange={setTermYears} suffix="years" />
      </div>
      <div>
        <ResultRow label="Loan amount" value={formatAed(result.loanAmount)} />
        <ResultRow label="Monthly payment" value={formatAed(result.monthlyPayment)} />
        <ResultRow label="Total interest" value={formatAed(result.totalInterest)} />
        <ResultRow label="Total repayment" value={formatAed(result.totalRepayment)} />
      </div>
    </div>
  );
}

function AffordabilityCalc() {
  const [monthlyIncome, setMonthlyIncome] = useState("30000");
  const [existingMonthlyDebts, setExistingMonthlyDebts] = useState("0");
  const [rate, setRate] = useState("4");
  const [termYears, setTermYears] = useState("25");
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const result = useMemo(
    () =>
      calculateAffordability({
        monthlyIncome: num(monthlyIncome),
        existingMonthlyDebts: num(existingMonthlyDebts),
        annualInterestRatePercent: num(rate),
        termYears: num(termYears),
        downPaymentPercent: num(downPaymentPercent),
      }),
    [monthlyIncome, existingMonthlyDebts, rate, termYears, downPaymentPercent],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Monthly income" value={monthlyIncome} onChange={setMonthlyIncome} suffix="AED" />
        <Field label="Existing monthly debts" value={existingMonthlyDebts} onChange={setExistingMonthlyDebts} suffix="AED" />
        <Field label="Annual interest rate" value={rate} onChange={setRate} suffix="%" />
        <Field label="Term" value={termYears} onChange={setTermYears} suffix="years" />
        <Field label="Down payment" value={downPaymentPercent} onChange={setDownPaymentPercent} suffix="%" />
      </div>
      <div>
        <ResultRow label="Max monthly payment (50% DBR cap)" value={formatAed(result.maxMonthlyPayment)} />
        <ResultRow label="Max loan amount" value={formatAed(result.maxLoanAmount)} />
        <ResultRow label="Max property price" value={formatAed(result.maxPropertyPrice)} />
      </div>
    </div>
  );
}

function DownPaymentCalc() {
  const [price, setPrice] = useState("1000000");
  const [isFirstProperty, setIsFirstProperty] = useState(true);
  const minPercent = minimumDownPaymentPercent(num(price), isFirstProperty);
  const minAmount = (num(price) * minPercent) / 100;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Property price" value={price} onChange={setPrice} suffix="AED" />
        <div>
          <Label>Property type</Label>
          <div className="flex gap-4 text-sm text-charcoal/70">
            <label className="flex items-center gap-2">
              <input type="radio" checked={isFirstProperty} onChange={() => setIsFirstProperty(true)} /> First property
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={!isFirstProperty} onChange={() => setIsFirstProperty(false)} /> Additional property
            </label>
          </div>
        </div>
      </div>
      <div>
        <ResultRow label="Minimum down payment (UAE mortgage cap)" value={`${minPercent}%`} />
        <ResultRow label="Minimum down payment amount" value={formatAed(minAmount)} />
      </div>
    </div>
  );
}

function CapitalAppreciationCalc() {
  const [currentValue, setCurrentValue] = useState("1000000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("5");
  const result = useMemo(
    () => calculateCapitalAppreciation({ currentValue: num(currentValue), annualAppreciationRatePercent: num(rate), years: num(years) }),
    [currentValue, rate, years],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Current value" value={currentValue} onChange={setCurrentValue} suffix="AED" />
        <Field label="Annual appreciation rate" value={rate} onChange={setRate} suffix="%" />
        <Field label="Years" value={years} onChange={setYears} />
      </div>
      <div>
        <ResultRow label="Future value" value={formatAed(result.futureValue)} />
        <ResultRow label="Total appreciation" value={formatAed(result.totalAppreciation)} />
      </div>
    </div>
  );
}

function InvestmentComparisonCalc() {
  const [a, setA] = useState({ label: "Property A", price: "1000000", annualRent: "60000", rate: "4" });
  const [b, setB] = useState({ label: "Property B", price: "1500000", annualRent: "100000", rate: "5" });
  const [years, setYears] = useState("5");

  const results = useMemo(
    () =>
      compareInvestments([
        { label: a.label, price: num(a.price), annualRent: num(a.annualRent), annualAppreciationRatePercent: num(a.rate), years: num(years) },
        { label: b.label, price: num(b.price), annualRent: num(b.annualRent), annualAppreciationRatePercent: num(b.rate), years: num(years) },
      ]),
    [a, b, years],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {[{ state: a, setState: setA }, { state: b, setState: setB }].map(({ state, setState }, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-charcoal/10 p-4">
            <Input value={state.label} onChange={(e) => setState({ ...state, label: e.target.value })} />
            <Field label="Price" value={state.price} onChange={(v) => setState({ ...state, price: v })} suffix="AED" />
            <Field label="Annual rent" value={state.annualRent} onChange={(v) => setState({ ...state, annualRent: v })} suffix="AED" />
            <Field label="Appreciation rate" value={state.rate} onChange={(v) => setState({ ...state, rate: v })} suffix="%" />
          </div>
        ))}
      </div>
      <Field label="Comparison period" value={years} onChange={setYears} suffix="years" />
      <div>
        {results.map((r) => (
          <ResultRow key={r.label} label={`${r.label} — total return`} value={`${formatAed(r.totalReturn)} (${r.totalReturnPercent}%)`} />
        ))}
      </div>
    </div>
  );
}

function OffPlanCalc() {
  const [price, setPrice] = useState("1000000");
  const [plan, setPlan] = useState("60/40");
  const [installments, setInstallments] = useState("6");
  const result = useMemo(
    () => calculateOffPlanPaymentPlan({ price: num(price), plan, constructionInstallments: num(installments) }),
    [price, plan, installments],
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <Field label="Property price" value={price} onChange={setPrice} suffix="AED" />
        <div>
          <Label>Payment plan (construction/handover)</Label>
          <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="60/40" />
        </div>
        <Field label="Construction installments" value={installments} onChange={setInstallments} />
      </div>
      <div>
        {result ? (
          <>
            <ResultRow label="During construction" value={formatAed(result.constructionTotal)} />
            <ResultRow label="Per installment" value={formatAed(result.perInstallment)} />
            <ResultRow label="On handover" value={formatAed(result.handoverTotal)} />
          </>
        ) : (
          <p className="text-sm text-red-600">Enter a valid plan like &quot;60/40&quot; (must total 100).</p>
        )}
      </div>
    </div>
  );
}
