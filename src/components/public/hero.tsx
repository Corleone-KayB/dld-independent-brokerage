import { Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-charcoal text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,98,0.18),_transparent_60%)]" />
      <div className="container-shell relative py-24 sm:py-32">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-champagne-light">
          A private independent brokerage network
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Dubai Real Estate. Connected by Trusted Independent Partners.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ivory/70">
          Discover properties, connect with verified real-estate professionals
          and access a trusted network of independent brokerage partners
          across Dubai.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/properties" size="lg" variant="primary">
            <Search className="h-4 w-4" /> Explore Properties
          </Button>
          <Button href="/partners" size="lg" variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10">
            <Users className="h-4 w-4" /> Become a Partner
          </Button>
          <Button href="/brokers" size="lg" variant="ghost" className="text-ivory hover:bg-ivory/10">
            <ShieldCheck className="h-4 w-4" /> Verify a Broker
          </Button>
        </div>
      </div>
    </section>
  );
}
