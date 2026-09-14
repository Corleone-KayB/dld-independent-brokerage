import type { Metadata } from "next";
import { listDeals } from "@/modules/deals/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DealStageSelect } from "@/components/crm/deal-stage-select";
import { formatAed } from "@/lib/utils/format";
import { DEAL_STAGE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Deals" };

export default async function AdminDealsPage() {
  const deals = await listDeals({});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">All Deals</h1>
        <p className="mt-1 text-charcoal/60">{deals.length} deals across the platform.</p>
      </div>

      {deals.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No deals yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Stage</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">{deal.broker?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">{deal.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">{deal.value ? formatAed(deal.value) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{DEAL_STAGE_LABELS[deal.stage]}</Badge>
                      <DealStageSelect dealId={deal.id} stage={deal.stage} />
                    </div>
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
