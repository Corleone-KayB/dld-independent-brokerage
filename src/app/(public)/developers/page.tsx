import type { Metadata } from "next";
import { listDevelopers } from "@/modules/developers/service";
import { DeveloperCard } from "@/components/developer/developer-card";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Developers" };

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const result = await listDevelopers({ page });

  return (
    <div className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Developers</h1>
      <p className="mt-2 max-w-2xl text-charcoal/60">
        Browse verified developer profiles and their off-plan project inventory.
      </p>

      {result.items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-charcoal/20 p-12 text-center text-charcoal/50">
          No developers on the platform yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((developer) => (
            <DeveloperCard key={developer.id} developer={developer} />
          ))}
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        buildHref={(p) => `/developers?page=${p}`}
      />
    </div>
  );
}
