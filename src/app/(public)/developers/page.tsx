import type { Metadata } from "next";
import { listDevelopers } from "@/modules/developers/service";
import { DeveloperCard } from "@/components/developer/developer-card";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Developers" };
export const dynamic = "force-dynamic";

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
      <PageHeader title="Developers" description="Browse verified developer profiles and their off-plan project inventory." />

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
