import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-shell max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">About Us</h1>
      <div className="mt-6 space-y-4 text-charcoal/70">
        <p>
          DLD Independent Brokerage Partners is a private digital platform
          connecting verified independent brokers, brokerage partners and
          their clients across Dubai. We are not the Dubai Land Department,
          RERA, or any government entity — we are an independent network that
          complements official services.
        </p>
        <p>
          Our platform brings together property discovery, a professional
          broker directory, an embedded CRM and a compliance center so that
          independent brokers and brokerage companies can run their business
          in one place.
        </p>
        <p>
          For official licensing verification, transaction records and
          government services, please always refer to the Dubai Land
          Department directly.
        </p>
      </div>
    </div>
  );
}
