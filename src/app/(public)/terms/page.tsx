import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="container-shell max-w-3xl py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm text-charcoal/70">
        <p>
          This is placeholder legal content for the MVP demonstration
          environment. It should be replaced with counsel-reviewed terms
          before any production launch.
        </p>
        <p>
          DLD Independent Brokerage Partners is an independent private
          platform. It is not affiliated with, endorsed by, or operated by
          the Dubai Land Department or any government entity. Partners are
          responsible for maintaining valid, current official licensing.
        </p>
      </div>
    </div>
  );
}
