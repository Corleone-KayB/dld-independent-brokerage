import type { Metadata } from "next";
import { getAdminDashboardStats } from "@/modules/admin/service";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const cards = [
    { label: "Total Partners", value: stats.totalPartners },
    { label: "Verified Brokers", value: stats.verifiedBrokers },
    { label: "Active Properties", value: stats.activeProperties },
    { label: "Active Leads", value: stats.activeLeads },
    { label: "Pending Applications", value: stats.pendingApplications },
    { label: "Compliance Issues", value: stats.complianceIssues },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Admin Control Center</h1>
        <p className="mt-1 text-charcoal/60">Platform-wide overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-charcoal">{card.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
