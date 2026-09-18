import type { Metadata } from "next";
import { searchBrokers } from "@/modules/brokers/service";
import { BrokerCard } from "@/components/broker/broker-card";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Find a Verified Broker" };
export const dynamic = "force-dynamic";

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
      <PageHeader
        title="Find a Verified Broker"
        description="Search our directory of independent brokers and brokerage partners. Verification badges reflect our own platform review — always confirm official licensing directly with the Dubai Land Department."
      />

      <form
        className="mt-8 flex max-w-xl gap-3 rounded-2xl border border-stone/20 bg-soft-white p-3 shadow-elevated"
        action="/brokers"
        method="get"
      >
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or specialization"
          className="border-0 bg-transparent"
        />
        <Button type="submit" className="shrink-0">
          Search
        </Button>
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
