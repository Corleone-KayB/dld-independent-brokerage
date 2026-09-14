import type { Metadata } from "next";
import { CalculatorsPanel } from "@/components/investor/calculators-panel";

export const metadata: Metadata = { title: "Investment Calculators" };

export default function CalculatorsPage() {
  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Investment Calculators</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Model returns, mortgage payments, and payment plans. All figures are
        calculated from the numbers you enter — not financial advice.
      </p>
      <div className="mt-8">
        <CalculatorsPanel />
      </div>
    </div>
  );
}
