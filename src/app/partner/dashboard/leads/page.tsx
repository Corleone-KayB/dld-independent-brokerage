import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listLeads } from "@/modules/leads/service";
import { listClients } from "@/modules/crm/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadStatusSelect } from "@/components/crm/lead-status-select";
import { NewLeadForm } from "@/components/crm/new-lead-form";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatAed, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const [leads, clients] = await Promise.all([
    listLeads({ partnerId: user.partnerId }),
    listClients(user.partnerId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Leads</h1>
          <p className="mt-1 text-charcoal/60">Manage your lead pipeline.</p>
        </div>
        <NewLeadForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {leads.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No leads yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Temperature</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">{lead.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">{lead.property?.title ?? "—"}</td>
                  <td className="px-4 py-3">{lead.budget ? formatAed(lead.budget) : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={lead.temperature === "HOT" ? "danger" : lead.temperature === "WARM" ? "warning" : "neutral"}>
                      {lead.temperature}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-charcoal/50">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-charcoal/40">
        Statuses: {Object.values(LEAD_STATUS_LABELS).join(" → ")}
      </p>
    </div>
  );
}
