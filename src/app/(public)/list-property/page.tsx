import type { Metadata } from "next";
import { OwnerListingForm } from "@/components/property/owner-listing-form";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "List My Property" };

export default function ListPropertyPage() {
  return (
    <div className="container-shell py-12">
      <PageHeader
        align="center"
        title="List My Property"
        description="Tell us about your property and we'll either connect you with your preferred broker or match you with a verified independent broker from our network."
        className="mb-8"
      />
      <OwnerListingForm />
    </div>
  );
}
