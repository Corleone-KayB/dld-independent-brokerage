import Link from "next/link";
import { ShieldCheck, Building2, Users2, FileCheck2 } from "lucide-react";
import { Hero } from "@/components/public/hero";
import { PromoBanners } from "@/components/public/promo-banners";
import { PropertyCard } from "@/components/property/property-card";
import { BrokerCard } from "@/components/broker/broker-card";
import { Button } from "@/components/ui/button";
import { searchProperties } from "@/modules/properties/service";
import { searchBrokers } from "@/modules/brokers/service";
import { propertySearchSchema } from "@/lib/validations/property";
import { COMMUNITIES, DEMO_DATA_DISCLAIMER } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ items: properties }, { items: brokers }] = await Promise.all([
    searchProperties(propertySearchSchema.parse({ page: 1, pageSize: 6 }), { publicOnly: true }),
    searchBrokers({ page: 1, pageSize: 4 }),
  ]);

  return (
    <>
      <Hero />

      <section className="border-b border-charcoal/10 bg-soft-white py-6">
        <p className="container-shell text-center text-xs text-charcoal/50">{DEMO_DATA_DISCLAIMER}</p>
      </section>

      <PromoBanners />

      <section className="container-shell py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
              Featured Properties
            </h2>
            <p className="mt-2 text-charcoal/60">Curated listings across Dubai&apos;s most sought-after communities.</p>
          </div>
          <Button href="/properties" variant="outline" size="sm" className="hidden sm:inline-flex">
            View all
          </Button>
        </div>

        {properties.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
            No properties published yet. Run the seed script to populate demo listings.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-champagne/10 bg-deep-blue py-20 text-ivory">
        <div className="container-shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-ivory/10">
          {[
            { icon: ShieldCheck, title: "Platform Verified Partners", desc: "Every partner passes our internal verification workflow before appearing publicly." },
            { icon: Building2, title: "Curated Inventory", desc: "Listings reviewed for accuracy before publication." },
            { icon: Users2, title: "Independent Network", desc: "A trusted network of independent brokers and brokerage companies." },
            { icon: FileCheck2, title: "Compliance-first", desc: "Documents, licenses and agreements tracked with expiry alerts." },
          ].map((item) => (
            <div key={item.title} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <item.icon className="h-6 w-6 text-champagne-light" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ivory/60">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-shell py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
              Find a Verified Broker
            </h2>
            <p className="mt-2 text-charcoal/60">Search our directory of independent brokerage professionals.</p>
          </div>
          <Button href="/brokers" variant="outline" size="sm" className="hidden sm:inline-flex">
            Browse directory
          </Button>
        </div>

        {brokers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
            No brokers seeded yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {brokers.map((broker) => (
              <BrokerCard key={broker.id} broker={broker} />
            ))}
          </div>
        )}
      </section>

      <section className="container-shell pb-20">
        <h2 className="mb-6 font-display text-2xl font-semibold text-charcoal">Explore Dubai Communities</h2>
        <div className="flex flex-wrap gap-3">
          {COMMUNITIES.map((community) => (
            <Link
              key={community}
              href={`/communities/${encodeURIComponent(community)}`}
              className="focus-ring rounded-full border border-charcoal/15 px-4 py-2 text-sm text-charcoal/70 transition-colors hover:border-champagne hover:text-charcoal"
            >
              {community}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-charcoal py-20 text-center text-ivory">
        <div className="container-shell">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Ready to grow your brokerage business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ivory/70">
            Join a trusted network of independent brokers and brokerage
            partners. Apply in minutes.
          </p>
          <Button href="/partners" size="lg" variant="primary" className="mt-8">
            Become a Partner
          </Button>
        </div>
      </section>
    </>
  );
}
