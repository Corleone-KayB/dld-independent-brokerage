import type { Metadata } from "next";
import Link from "next/link";
import { listApplications } from "@/modules/partners/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PARTNER_STATUS_LABELS, PARTNER_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Partner Applications" };

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  APPROVED: "success",
  PENDING_VERIFICATION: "warning",
  UNDER_REVIEW: "neutral",
  MORE_INFORMATION_REQUIRED: "warning",
  REJECTED: "danger",
  SUSPENDED: "danger",
};

export default async function AdminApplicationsPage() {
  const result = await listApplications({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Partner Applications</h1>
        <p className="mt-1 text-charcoal/60">{result.total} applications received.</p>
      </div>

      {result.items.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No applications yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((app) => (
                <tr key={app.id} className="border-b border-charcoal/5 last:border-0 hover:bg-charcoal/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`} className="focus-ring font-medium text-charcoal hover:text-champagne-dark">
                      {app.fullName}
                    </Link>
                    <p className="text-xs text-charcoal/50">{app.email}</p>
                  </td>
                  <td className="px-4 py-3">{PARTNER_TYPE_LABELS[app.type] ?? app.type}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[app.status] ?? "neutral"}>{PARTNER_STATUS_LABELS[app.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/50">{formatDate(app.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
