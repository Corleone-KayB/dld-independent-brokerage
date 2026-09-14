import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { getClient } from "@/modules/crm/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewActivityForm } from "@/components/crm/new-activity-form";
import { formatAed, formatDate } from "@/lib/utils/format";
import { LEAD_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Client Profile" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const client = await getClient(id);

  if (!client || (user?.partnerId && client.partnerId !== user.partnerId)) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">{client.name}</h1>
        <p className="mt-1 text-charcoal/60">{client.email || client.phone || "No contact info"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="font-display text-lg font-semibold text-charcoal">Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/50">Budget</dt><dd>{client.budget ? formatAed(client.budget) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/50">Nationality</dt><dd>{client.nationality ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/50">Intent</dt><dd>{client.intent ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/50">Financing</dt><dd>{client.financingStatus ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/50">Source</dt><dd>{client.leadSource ?? "—"}</dd></div>
          </dl>
          {client.notes && <p className="mt-4 text-sm text-charcoal/70">{client.notes}</p>}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-charcoal">Leads</h2>
            {client.leads.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal/50">No leads yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {client.leads.map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0">
                    <span>{formatDate(lead.createdAt)}</span>
                    <Badge tone="neutral">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-charcoal">Appointments</h2>
            {client.appointments.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal/50">No appointments scheduled.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {client.appointments.map((appt) => (
                  <li key={appt.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0">
                    <span>{formatDate(appt.startsAt)}</span>
                    <Badge tone="neutral">{appt.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-charcoal">Activity Log</h2>
            <div className="mt-4">
              <NewActivityForm clientId={client.id} />
            </div>
            <ul className="mt-6 space-y-3 text-sm">
              {client.activities.map((activity) => (
                <li key={activity.id} className="rounded-lg bg-charcoal/5 p-3">
                  <p className="text-xs text-charcoal/50">{formatDate(activity.createdAt)} · {activity.type}</p>
                  <p className="mt-1 text-charcoal/80">{activity.note}</p>
                </li>
              ))}
              {client.activities.length === 0 && <p className="text-charcoal/50">No activity logged yet.</p>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
