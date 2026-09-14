import type { Metadata } from "next";
import { searchBrokers } from "@/modules/brokers/service";
import { BrokerCard } from "@/components/broker/broker-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Find a Verified Broker" };

export default async function BrokersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const q = typeof params.q === "string" ? params.q : undefined;
  const area = typeof params.area === "string" ? params.area : undefined;

  const result = await searchBrokers({ page, q, area });

  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Find a Verified Broker</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Search our directory of independent brokers and brokerage partners.
        Verification badges reflect our own platform review — always confirm
        official licensing directly with the Dubai Land Department.
      </p>

      <form className="mt-8 flex max-w-md gap-3" action="/brokers" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or specialization"
          className="focus-ring h-11 flex-1 rounded-lg border border-charcoal/15 bg-white px-4 text-sm"
        />
        <button className="focus-ring rounded-full bg-champagne px-6 text-sm font-medium text-charcoal hover:bg-champagne-light">
          Search
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
          No brokers found.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((broker) => (
            <BrokerCard key={broker.id} broker={broker} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={(p) => `/brokers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`}
      />
    </div>
  );
}
