import type { Metadata } from "next";
import { prisma } from "@/server/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadAssignSelect } from "@/components/admin/lead-assign-select";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Leads" };

export default async function AdminLeadsPage() {
  const [leads, brokers] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { client: true, broker: true },
    }),
    prisma.broker.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Lead Management</h1>
        <p className="mt-1 text-charcoal/60">{leads.length} leads across the platform.</p>
      </div>

      {leads.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No leads yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Assigned Broker</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3">{lead.client?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge tone="neutral">{LEAD_STATUS_LABELS[lead.status]}</Badge></td>
                  <td className="px-4 py-3 text-charcoal/50">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <LeadAssignSelect leadId={lead.id} brokerId={lead.brokerId} brokers={brokers} />
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
