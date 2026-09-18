import Image from "next/image";
import { Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-obsidian text-ivory">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Legibility scrim: opaque at the text edge, fading out so the photograph reads clearly on the right two-thirds. */}
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/60 to-transparent sm:to-obsidian/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-obsidian/10" />
      </div>

      <div className="container-shell relative py-24 sm:py-32">
        <p className="motion-safe:translate-y-3 motion-safe:opacity-0 motion-safe:animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-champagne-light backdrop-blur-sm">
          A private independent brokerage network
        </p>
        <h1 className="motion-safe:translate-y-3 motion-safe:opacity-0 motion-safe:animate-fade-up max-w-3xl font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl [animation-delay:80ms]">
          Dubai Real Estate. Connected by Trusted Independent Partners.
        </h1>
        <p className="motion-safe:translate-y-3 motion-safe:opacity-0 motion-safe:animate-fade-up mt-6 max-w-xl text-lg text-ivory/75 [animation-delay:160ms]">
          Discover properties, connect with verified real-estate professionals
          and access a trusted network of independent brokerage partners
          across Dubai.
        </p>

        <div className="motion-safe:translate-y-3 motion-safe:opacity-0 motion-safe:animate-fade-up mt-10 flex flex-wrap gap-4 [animation-delay:240ms]">
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
