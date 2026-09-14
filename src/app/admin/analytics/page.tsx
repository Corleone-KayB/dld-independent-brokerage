import type { Metadata } from "next";
import { getAnalyticsOverview } from "@/modules/analytics/service";
import { rankBrokerPerformance } from "@/server/analytics/broker-performance";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const [overview, brokerRanking] = await Promise.all([getAnalyticsOverview(), rankBrokerPerformance()]);

  const kpis = [
    { label: "Total Leads", value: overview.totalLeads },
    { label: "Conversion Rate", value: `${overview.conversionRatePercent}%` },
    { label: "Property Views", value: overview.propertyViews },
    { label: "Enquiries", value: overview.enquiries },
    { label: "Viewings", value: overview.viewings },
    { label: "Offers", value: overview.offers },
    { label: "Deals (Total / Closed)", value: `${overview.totalDeals} / ${overview.closedDeals}` },
    { label: "Revenue (Closed Deals)", value: formatAed(overview.revenue) },
    { label: "Commission", value: formatAed(overview.commission) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Advanced Analytics</h1>
        <p className="mt-1 text-charcoal/60">Platform-wide performance, sourced directly from live data.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-charcoal">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Leads by Source</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {overview.leadsBySource.map((row) => (
              <li key={row.source} className="flex items-center justify-between border-b border-charcoal/5 py-1.5 last:border-0">
                <span className="text-charcoal/70">{row.source}</span>
                <Badge tone="neutral">{row.count}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">Leads by Area</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {overview.leadsByArea.map((row) => (
              <li key={row.area} className="flex items-center justify-between border-b border-charcoal/5 py-1.5 last:border-0">
                <span className="text-charcoal/70">{row.area}</span>
                <Badge tone="neutral">{row.count}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Community Performance (Hot Areas)</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Ranked by active listing count — average price and yield are computed from published listings.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="py-2 pr-4">Community</th>
                <th className="py-2 pr-4">Listings</th>
                <th className="py-2 pr-4">Avg Price</th>
                <th className="py-2 pr-4">Avg Yield</th>
              </tr>
            </thead>
            <tbody>
              {overview.communityPerformance.map((row) => (
                <tr key={row.community} className="border-b border-charcoal/5 last:border-0">
                  <td className="py-2 pr-4">{row.community}</td>
                  <td className="py-2 pr-4">{row.listingCount}</td>
                  <td className="py-2 pr-4">{formatAed(row.averagePrice)}</td>
                  <td className="py-2 pr-4">{row.averageYield ? `${row.averageYield}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-charcoal">Broker Performance Ranking</h2>
        <p className="mt-1 text-xs text-charcoal/50">
          Weighted score from conversion rate, closed deals, commission earned, and active listings.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="py-2 pr-4">Broker</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Conversion</th>
                <th className="py-2 pr-4">Closed Deals</th>
                <th className="py-2 pr-4">Commission Earned</th>
                <th className="py-2 pr-4">Listings</th>
              </tr>
            </thead>
            <tbody>
              {brokerRanking.map((broker) => (
                <tr key={broker.brokerId} className="border-b border-charcoal/5 last:border-0">
                  <td className="py-2 pr-4 font-medium text-charcoal">{broker.brokerName}</td>
                  <td className="py-2 pr-4"><Badge tone="champagne">{broker.performanceScore}</Badge></td>
                  <td className="py-2 pr-4">{broker.conversionRatePercent}%</td>
                  <td className="py-2 pr-4">{broker.closedDeals}</td>
                  <td className="py-2 pr-4">{formatAed(broker.totalCommissionEarned)}</td>
                  <td className="py-2 pr-4">{broker.activeListings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
