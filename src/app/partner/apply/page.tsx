import type { Metadata } from "next";
import { ApplyWizard } from "@/components/partner/apply-wizard";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Partner Application" };

export default function PartnerApplyPage() {
  return (
    <div className="container-shell py-12">
      <PageHeader
        align="center"
        title="Partner Application"
        description="Complete the steps below to apply to join our independent brokerage network."
        className="mb-8"
      />
      <ApplyWizard />
    </div>
  );
}
