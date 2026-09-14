import type { Metadata } from "next";
import { listMarketplaceLeads } from "@/modules/leads/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcceptLeadButton } from "@/components/crm/accept-lead-button";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Lead Marketplace" };

export default async function LeadMarketplacePage() {
  const leads = await listMarketplaceLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Lead Marketplace</h1>
        <p className="mt-1 text-charcoal/60">
          New opportunities released by our team. Accept a lead to add it to your own pipeline.
        </p>
      </div>

      {leads.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No opportunities available right now.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-base font-semibold text-charcoal">
                    {lead.property?.title ?? "New Opportunity"}
                  </p>
                  <p className="mt-1 text-xs text-charcoal/50">
                    {lead.property?.community ?? "Location flexible"}
                    {lead.budget ? ` · Budget ${formatAed(lead.budget)}` : ""}
                  </p>
                </div>
                <Badge tone={lead.temperature === "HOT" ? "danger" : "warning"}>
                  Score {lead.score ?? 0}/100
                </Badge>
              </div>
              {lead.message && <p className="mt-3 text-sm text-charcoal/70">{lead.message}</p>}
              <div className="mt-4 flex justify-end">
                <AcceptLeadButton leadId={lead.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
