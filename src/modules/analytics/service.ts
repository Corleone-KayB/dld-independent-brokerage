import "server-only";
import { prisma } from "@/server/db/client";
import { compareAreas } from "@/server/advisor/property-advisor";

export interface AnalyticsOverview {
  leadsBySource: { source: string; count: number }[];
  leadsByArea: { area: string; count: number }[];
  leadsByBroker: { brokerName: string; count: number }[];
  totalLeads: number;
  closedLeads: number;
  conversionRatePercent: number;
  propertyViews: number;
  enquiries: number;
  viewings: number;
  offers: number;
  totalDeals: number;
  closedDeals: number;
  revenue: number;
  commission: number;
  communityPerformance: ReturnType<typeof compareAreas>;
}

/** Advanced Analytics (spec §23). All figures are direct aggregates over real data — nothing estimated or fabricated. */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [
    leadsBySourceRaw,
    leadsByBrokerRaw,
    totalLeads,
    closedLeads,
    viewCountAgg,
    enquiries,
    viewings,
    offers,
    totalDeals,
    closedDeals,
    revenueAgg,
    commissionAgg,
    publishedProperties,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], _count: true }),
    prisma.lead.groupBy({ by: ["brokerId"], _count: true, where: { brokerId: { not: null } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CLOSED" } }),
    prisma.property.aggregate({ _sum: { viewCount: true } }),
    prisma.enquiryLog.count({ where: { type: { not: "PROPERTY_VIEW" } } }),
    prisma.appointment.count(),
    prisma.deal.count({ where: { stage: "OFFER" } }),
    prisma.deal.count(),
    prisma.deal.count({ where: { stage: "CLOSED" } }),
    prisma.deal.aggregate({ where: { stage: "CLOSED" }, _sum: { value: true } }),
    prisma.commission.aggregate({ where: { status: { in: ["EXPECTED", "APPROVED", "PAID"] } }, _sum: { amount: true } }),
    prisma.property.findMany({ where: { status: "PUBLISHED" } }),
  ]);

  const brokerIds = leadsByBrokerRaw.map((row) => row.brokerId).filter((id): id is string => !!id);
  const brokers = await prisma.broker.findMany({ where: { id: { in: brokerIds } }, select: { id: true, name: true } });
  const brokerNameById = new Map(brokers.map((b) => [b.id, b.name]));

  const leadsWithLocation = await prisma.lead.findMany({
    select: { property: { select: { community: true } }, client: { select: { preferredLocations: true } } },
  });
  const areaCounts = new Map<string, number>();
  for (const lead of leadsWithLocation) {
    const area = lead.property?.community ?? lead.client?.preferredLocations[0] ?? "Unknown";
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
  }
  const leadsByArea = Array.from(areaCounts.entries())
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  return {
    leadsBySource: leadsBySourceRaw.map((row) => ({ source: row.source ?? "Unknown", count: row._count })),
    leadsByArea,
    leadsByBroker: leadsByBrokerRaw.map((row) => ({
      brokerName: brokerNameById.get(row.brokerId!) ?? "Unknown",
      count: row._count,
    })),
    totalLeads,
    closedLeads,
    conversionRatePercent: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
    propertyViews: viewCountAgg._sum.viewCount ?? 0,
    enquiries,
    viewings,
    offers,
    totalDeals,
    closedDeals,
    revenue: Number(revenueAgg._sum.value ?? 0),
    commission: Number(commissionAgg._sum.amount ?? 0),
    communityPerformance: compareAreas(publishedProperties),
  };
}
