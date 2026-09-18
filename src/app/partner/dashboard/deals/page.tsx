import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/server/rbac/guard";
import { listDeals } from "@/modules/deals/service";
import { listClients } from "@/modules/crm/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealStageSelect } from "@/components/crm/deal-stage-select";
import { NewDealForm } from "@/components/crm/new-deal-form";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Deals" };

export default async function DealsPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const [deals, clients] = await Promise.all([
    listDeals({ partnerId: user.partnerId }),
    listClients(user.partnerId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Deals</h1>
          <p className="mt-1 text-charcoal/60">Track transactions from viewing to closed.</p>
        </div>
        <NewDealForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {deals.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No deals yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/20 bg-soft-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/partner/dashboard/deals/${deal.id}`} className="underline hover:text-charcoal">
                      {deal.client?.name ?? "Deal"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{deal.property?.title ?? "—"}</td>
                  <td className="px-4 py-3">{deal.value ? formatAed(deal.value) : "—"}</td>
                  <td className="px-4 py-3">
                    {deal.commission ? (
                      <Badge tone="neutral">{formatAed(deal.commission.amount)} · {deal.commission.status}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DealStageSelect dealId={deal.id} stage={deal.stage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
