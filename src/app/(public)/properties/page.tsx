import type { Metadata } from "next";
import { searchProperties } from "@/modules/properties/service";
import { propertySearchSchema } from "@/lib/validations/property";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyCard } from "@/components/property/property-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const flatParams = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const parsed = propertySearchSchema.safeParse(flatParams);
  const input = parsed.success ? parsed.data : propertySearchSchema.parse({});

  const result = await searchProperties(input, { publicOnly: true });

  function buildHref(page: number) {
    const next = new URLSearchParams(flatParams as Record<string, string>);
    next.set("page", String(page));
    return `/properties?${next.toString()}`;
  }

  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Property Marketplace</h1>
      <p className="mt-2 text-charcoal/60">
        {result.total} propert{result.total === 1 ? "y" : "ies"} available across Dubai.
      </p>

      <div className="mt-8">
        <PropertyFilters />
      </div>

      {result.items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
          No properties match your filters. Try adjusting your search.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </div>
  );
}
