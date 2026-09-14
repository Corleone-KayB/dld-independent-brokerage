import type { Metadata } from "next";
import { ApplyWizard } from "@/components/partner/apply-wizard";

export const metadata: Metadata = { title: "Partner Application" };

export default function PartnerApplyPage() {
  return (
    <div className="container-shell py-12">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-display text-3xl font-semibold text-charcoal">Partner Application</h1>
        <p className="mt-2 text-charcoal/60">
          Complete the steps below to apply to join our independent brokerage
          network.
        </p>
      </div>
      <ApplyWizard />
    </div>
  );
}
