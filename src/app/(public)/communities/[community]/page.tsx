import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { searchProperties } from "@/modules/properties/service";
import { propertySearchSchema } from "@/lib/validations/property";
import { PropertyCard } from "@/components/property/property-card";
import { COMMUNITIES } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ community: string }> }): Promise<Metadata> {
  const { community } = await params;
  return { title: decodeURIComponent(community) };
}

export default async function CommunityPage({ params }: { params: Promise<{ community: string }> }) {
  const { community: rawCommunity } = await params;
  const community = decodeURIComponent(rawCommunity);
  if (!COMMUNITIES.includes(community as (typeof COMMUNITIES)[number])) notFound();

  const result = await searchProperties(
    propertySearchSchema.parse({ community, page: 1, pageSize: 9 }),
    { publicOnly: true },
  );

  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">{community}</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Discover available properties and featured brokers in {community}.
      </p>

      {result.items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
          No properties currently available in {community}.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
