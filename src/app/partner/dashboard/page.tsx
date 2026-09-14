import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { prisma } from "@/server/db/client";
import { listLeads } from "@/modules/leads/service";
import { Card } from "@/components/ui/card";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants";

export const metadata: Metadata = { title: "Partner Dashboard" };

export default async function DashboardOverviewPage() {
  const user = await getSessionUser();
  const partnerId = user?.partnerId ?? undefined;
  const brokerId = user?.brokerId ?? undefined;

  const [leadCount, clientCount, propertyCount, appointmentCount, leads] = await Promise.all([
    partnerId ? prisma.lead.count({ where: { partnerId, status: { notIn: ["CLOSED", "LOST"] } } }) : 0,
    partnerId ? prisma.client.count({ where: { partnerId } }) : 0,
    partnerId ? prisma.property.count({ where: { partnerId, status: "PUBLISHED" } }) : 0,
    partnerId
      ? prisma.appointment.count({ where: { partnerId, startsAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } } })
      : 0,
    listLeads({ partnerId, brokerId }),
  ]);

  const pipeline = LEAD_STATUS_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_LABELS[status],
    count: leads.filter((lead) => lead.status === status).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          Good day, {user?.name ?? "Partner"}
        </h1>
        <p className="mt-1 text-charcoal/60">Here&apos;s what&apos;s happening with your business.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Leads", value: leadCount },
          { label: "Active Clients", value: clientCount },
          { label: "Active Listings", value: propertyCount },
          { label: "Upcoming Viewings", value: appointmentCount },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{kpi.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-charcoal">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Lead Pipeline</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {pipeline.map((stage) => (
            <div key={stage.status} className="rounded-xl border border-charcoal/10 p-3 text-center">
              <p className="text-2xl font-semibold text-charcoal">{stage.count}</p>
              <p className="mt-1 text-[11px] text-charcoal/50">{stage.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
