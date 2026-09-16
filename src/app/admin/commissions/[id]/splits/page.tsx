import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCommission } from "@/modules/commissions/service";
import { listSplitsForCommission } from "@/modules/commission-splits/service";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { CreateSplitForm } from "@/components/admin/create-split-form";
import { RejectSplitButton } from "@/components/admin/reject-split-button";
import { NetworkActionButton } from "@/components/network/network-action-button";

export const metadata: Metadata = { title: "Commission Splits" };

const STATUS_TONE: Record<string, BadgeProps["tone"]> = {
  PENDING: "warning",
  APPROVED: "success",
  PAID: "success",
  REJECTED: "danger",
};

export default async function CommissionSplitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const commission = await getCommission(id);
  if (!commission) notFound();

  const splits = await listSplitsForCommission(id);
  const allocatedPercent = splits
    .filter((s) => s.status !== "REJECTED")
    .reduce((sum, s) => sum + Number(s.percent), 0);
  const remainingPercent = Math.max(0, 100 - allocatedPercent);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Commission Splits</h1>
          <p className="mt-1 text-charcoal/60">
            {commission.deal.property?.title ?? "Deal"} · Total commission {formatAed(commission.amount)}
          </p>
          <p className="mt-1 text-xs text-charcoal/50">
            {allocatedPercent.toFixed(2)}% allocated · {remainingPercent.toFixed(2)}% remaining
          </p>
        </div>
        <CreateSplitForm commissionId={id} remainingPercent={remainingPercent} />
      </div>

      {splits.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No splits on this commission yet.</Card>
      ) : (
        <div className="space-y-3">
          {splits.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-charcoal">{s.broker.name}</p>
                <p className="text-xs text-charcoal/50">
                  {s.percent.toString()}% · {formatAed(s.amount)}
                </p>
                {s.status === "REJECTED" && s.rejectionReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {s.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                {s.status === "PENDING" && (
                  <>
                    <NetworkActionButton endpoint={`/api/commissions/splits/${s.id}/approve`} label="Approve" />
                    <RejectSplitButton splitId={s.id} />
                  </>
                )}
                {s.status === "APPROVED" && (
                  <NetworkActionButton endpoint={`/api/commissions/splits/${s.id}/pay`} label="Mark Paid" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
