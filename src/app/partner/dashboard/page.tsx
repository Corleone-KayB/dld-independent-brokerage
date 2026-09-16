import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { prisma } from "@/server/db/client";
import { listLeads } from "@/modules/leads/service";
import { getNetworkActivity } from "@/server/analytics/broker-performance";
import { Card } from "@/components/ui/card";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/constants";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Partner Dashboard" };

export default async function DashboardOverviewPage() {
  const user = await getSessionUser();
  const partnerId = user?.partnerId ?? undefined;
  const brokerId = user?.brokerId ?? undefined;

  const [
    leadCount,
    clientCount,
    propertyCount,
    appointmentCount,
    offerCount,
    closedDealCount,
    commissionAgg,
    totalLeadCount,
    closedLeadCount,
    leads,
  ] = await Promise.all([
    partnerId ? prisma.lead.count({ where: { partnerId, status: { notIn: ["CLOSED", "LOST"] } } }) : 0,
    partnerId ? prisma.client.count({ where: { partnerId } }) : 0,
    partnerId ? prisma.property.count({ where: { partnerId, status: "PUBLISHED" } }) : 0,
    partnerId
      ? prisma.appointment.count({ where: { partnerId, startsAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } } })
      : 0,
    partnerId ? prisma.deal.count({ where: { partnerId, stage: "OFFER" } }) : 0,
    partnerId ? prisma.deal.count({ where: { partnerId, stage: "CLOSED" } }) : 0,
    partnerId
      ? prisma.commission.aggregate({ where: { partnerId, status: { in: ["EXPECTED", "APPROVED", "PAID"] } }, _sum: { amount: true } })
      : null,
    partnerId ? prisma.lead.count({ where: { partnerId } }) : 0,
    partnerId ? prisma.lead.count({ where: { partnerId, status: "CLOSED" } }) : 0,
    listLeads({ partnerId, brokerId }),
  ]);

  const network = brokerId ? await getNetworkActivity(brokerId) : null;

  const conversionRate = totalLeadCount > 0 ? Math.round((closedLeadCount / totalLeadCount) * 100) : 0;

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
          { label: "New Leads", value: leadCount },
          { label: "Active Clients", value: clientCount },
          { label: "Active Listings", value: propertyCount },
          { label: "Viewings", value: appointmentCount },
          { label: "Offers", value: offerCount },
          { label: "Closed Deals", value: closedDealCount },
          { label: "Commission", value: formatAed(commissionAgg?._sum.amount ?? 0) },
          { label: "Conversion Rate", value: `${conversionRate}%` },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-charcoal">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {network && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Independent Brokerage Network</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: "Connections", value: network.activeConnections },
              { label: "Referrals Completed", value: network.referralsCompleted },
              { label: "Deal Collaborations", value: network.dealCollaborations },
              { label: "Listings Shared", value: network.listingsShared },
              { label: "Peer Rating", value: network.rating !== null ? network.rating.toFixed(1) : "—" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-xl font-semibold text-charcoal">{stat.value}</p>
                <p className="mt-1 text-xs text-charcoal/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

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
