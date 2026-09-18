import type { Metadata } from "next";
import { CalculatorsPanel } from "@/components/investor/calculators-panel";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Investment Calculators" };

export default function CalculatorsPage() {
  return (
    <div className="container-shell py-12">
      <PageHeader
        title="Investment Calculators"
        description="Model returns, mortgage payments, and payment plans. All figures are calculated from the numbers you enter — not financial advice."
      />
      <div className="mt-8">
        <CalculatorsPanel />
      </div>
    </div>
  );
}
