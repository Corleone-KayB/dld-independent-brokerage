import type { Metadata } from "next";
import Link from "next/link";
import { listCommissions, getCommissionSummary } from "@/modules/commissions/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommissionStatusActions } from "@/components/admin/commission-status-actions";
import { formatAed } from "@/lib/utils/format";
import { COMMISSION_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Commissions" };

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  PENDING: "neutral",
  EXPECTED: "warning",
  APPROVED: "success",
  PAID: "success",
  DISPUTED: "danger",
};

export default async function AdminCommissionsPage() {
  const [commissions, summary] = await Promise.all([listCommissions({}), getCommissionSummary({})]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Commission Management</h1>
        <p className="mt-1 text-charcoal/60">{commissions.length} commissions across all partners.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(COMMISSION_STATUS_LABELS).map(([key, label]) => (
          <Card key={key} className="p-4">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
            <p className="mt-2 font-display text-xl font-semibold text-charcoal">
              {formatAed(summary[key as keyof typeof summary]?.total ?? 0)}
            </p>
          </Card>
        ))}
      </div>

      {commissions.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No commissions yet.</Card>
      ) : (
        <div className="space-y-3">
          {commissions.map((commission) => (
            <Card key={commission.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{commission.broker?.name ?? "Unassigned broker"}</p>
                <p className="text-xs text-charcoal/50">{commission.deal.property?.title ?? "Deal"} · {formatAed(commission.amount)}</p>
                {commission.disputedReason && <p className="mt-1 text-xs text-red-600">Dispute: {commission.disputedReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={STATUS_TONE[commission.status]}>{COMMISSION_STATUS_LABELS[commission.status]}</Badge>
                <CommissionStatusActions commissionId={commission.id} status={commission.status} />
                <Link
                  href={`/admin/commissions/${commission.id}/splits`}
                  className="text-xs text-charcoal/60 underline hover:text-charcoal"
                >
                  Manage splits
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
