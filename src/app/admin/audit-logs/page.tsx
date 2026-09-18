import type { Metadata } from "next";
import { listAuditLogs } from "@/modules/admin/service";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Audit Logs" };

export default async function AuditLogsPage() {
  const result = await listAuditLogs(1, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Audit Logs</h1>
        <p className="mt-1 text-charcoal/60">{result.total} recorded events.</p>
      </div>

      {result.items.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No audit events yet.</Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone/20 bg-soft-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 text-xs uppercase tracking-wide text-charcoal/50">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((log) => (
                <tr key={log.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-charcoal">{log.action}</td>
                  <td className="px-4 py-3 text-charcoal/60">{log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-3 text-charcoal/60">{log.actor?.name ?? log.actor?.email ?? "System"}</td>
                  <td className="px-4 py-3 text-charcoal/50">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
