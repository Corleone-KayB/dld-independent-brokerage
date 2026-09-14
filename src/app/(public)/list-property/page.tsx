import type { Metadata } from "next";
import { OwnerListingForm } from "@/components/property/owner-listing-form";

export const metadata: Metadata = { title: "List My Property" };

export default function ListPropertyPage() {
  return (
    <div className="container-shell py-12">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-display text-3xl font-semibold text-charcoal">List My Property</h1>
        <p className="mt-2 text-charcoal/60">
          Tell us about your property and we&apos;ll either connect you with
          your preferred broker or match you with a verified independent
          broker from our network.
        </p>
      </div>
      <OwnerListingForm />
    </div>
  );
}
