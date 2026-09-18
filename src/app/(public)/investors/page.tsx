import type { Metadata } from "next";
import { PropertyAdvisorForm } from "@/components/investor/property-advisor-form";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = { title: "Investor Hub" };

export default function InvestorsPage() {
  return (
    <div>
      <PageHero image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2400&q=80">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Investor Hub</h1>
        <p className="mt-3 max-w-2xl text-ivory/70">
          Tell us your budget and goals — our Property Advisor analyzes
          current listings and returns ranked matches with estimated
          rental income, yield, and risk notes calculated from the data.
        </p>
        <Button href="/calculators" variant="outline" className="mt-6 border-ivory/30 text-ivory hover:bg-ivory/10">
          Explore Investment Calculators
        </Button>
      </PageHero>

      <section className="container-shell py-12">
        <h2 className="font-display text-2xl font-semibold text-charcoal">AI Property Advisor</h2>
        <p className="mt-2 max-w-2xl text-charcoal/60">
          A deterministic recommendation engine — every figure below is
          calculated directly from listed property data, not a generic AI
          chatbot.
        </p>
        <div className="mt-6">
          <PropertyAdvisorForm />
        </div>
      </section>
    </div>
  );
}
